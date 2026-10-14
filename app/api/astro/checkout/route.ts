import { clearExpiredCheckout, ownedReport, reportOrder, saveCheckoutSession } from "@/db/payment-store";
import { createAstroOrder, switchAstroPlan } from "@/db/astro-store";
import { getRuntimeEnv } from "@/db/quiz-store";
import { fulfillSession } from "@/lib/payment-fulfillment";
import { PaymentError, paymentError, privateJson, requireSameOrigin } from "@/lib/payment-http";
import { readProfileId } from "@/lib/profile-cookie";
import { providerConfig } from "@/lib/payment-config";
import { orderRefundPolicy, LEGACY_REFUND_POLICY } from "@/lib/refund-policy";
import { checkoutOrigin, stripeClient } from "@/lib/stripe";
import { ASTRO_TEST_ID, ASTRO_TITLE, PLANS, isPlanId, planForAmount } from "@/lib/astro";

// Astro checkout always uses Stripe. Plan = order amount (see db/astro-store.ts).
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json() as { reportId?: unknown; plan?: unknown };
    if (typeof body.reportId !== "string") throw new PaymentError("Choose a report first.");
    if (!isPlanId(body.plan)) throw new PaymentError("Choose a plan first.");
    const plan = body.plan;
    const report = await ownedReport(body.reportId, readProfileId(request), request);
    if (report.test_id !== ASTRO_TEST_ID) throw new PaymentError("Report not found.", 404);
    const limiter = getRuntimeEnv().CHECKOUT_RATE_LIMIT;
    if (limiter && !(await limiter.limit({ key: `checkout:${report.profile_id}` })).success) {
      return new Response(JSON.stringify({ error: "Too many checkout attempts. Please wait one minute and try again." }),
        { status: 429, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Retry-After": "60" } });
    }
    const config = providerConfig("stripe");
    if (!config.ready) throw new PaymentError("Checkout is not available yet. Please try again later.", 503);
    const livemode = !config.sandbox;
    let order = await reportOrder(report.id);
    if (order?.status === "paid") return privateJson({ url: `/reports/${report.id}` });
    if (order?.status === "refunded") throw new PaymentError("This purchase was refunded. Take the quiz again to buy a new reading.", 409);
    if (order && Boolean(order.livemode) !== livemode) throw new PaymentError("Please take the quiz again in this payment environment.", 409);

    const stripe = stripeClient();
    const successUrl = (origin: string) => `${origin}/reports/${report.id}?payment=success`;
    const origin = checkoutOrigin(request);
    if (!order) order = await createAstroOrder(report.id, plan, livemode);

    if (order.stripe_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (existing.status === "complete") {
        await fulfillSession(existing);
        return privateJson({ url: successUrl(origin) });
      }
      if (existing.status === "open" && planForAmount(order.amount_cents) === plan && existing.url) return privateJson({ url: existing.url });
      if (existing.status === "open") await stripe.checkout.sessions.expire(existing.id);
      await clearExpiredCheckout(order, existing.id, "payment_orders");
      order = (await reportOrder(report.id))!;
    }
    if (planForAmount(order.amount_cents) !== plan) order = await switchAstroPlan(order, plan);
    if (order.status === "paid") return privateJson({ url: `/reports/${report.id}` });
    if (order.amount_cents !== PLANS[plan].cents) throw new PaymentError("The price has changed. Refresh this page before purchasing.", 409);

    const refundPolicy = await orderRefundPolicy(order.id);
    const metadata = { order_id: order.id, report_id: report.id, test_id: ASTRO_TEST_ID, plan, refund_policy: refundPolicy };
    const session = await stripe.checkout.sessions.create({
      mode: "payment", payment_method_types: ["card"], customer_email: report.email,
      client_reference_id: order.id, metadata, payment_intent_data: { metadata },
      custom_text: { submit: { message: refundPolicy === LEGACY_REFUND_POLICY
        ? "This order retains our original 14-day refund request policy. Details: https://deeppersonaai.com/refunds/legacy-2026-09"
        : "Digital reading for entertainment and self-reflection. No refunds after successful delivery for change of mind. Exceptions apply for delivery failure, duplicate charges, material misdescription and legal rights. Details: https://deeppersonaai.com/refunds" } },
      line_items: [{ price_data: {
        currency: order.currency, unit_amount: order.amount_cents,
        product_data: { name: `${ASTRO_TITLE} — ${PLANS[plan].name}` },
      }, quantity: 1 }],
      success_url: successUrl(origin),
      cancel_url: `${origin}/reports/${report.id}?payment=cancelled`,
    }, { idempotencyKey: `payment_orders-${order.id}-${order.attempt}` });
    await saveCheckoutSession(order, session.id, "payment_orders");
    if (!session.url) throw new PaymentError("Unable to open checkout.", 503);
    return privateJson({ url: session.url });
  } catch (error) { return paymentError(error); }
}
