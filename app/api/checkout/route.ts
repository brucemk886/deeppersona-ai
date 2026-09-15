import {
  clearExpiredCheckout,
  createDeepOrder,
  createOrder,
  currentDeepPrice,
  currentPrice,
  deepOrder,
  ownedReport,
  reportOrder,
  saveCheckoutSession,
  snapshotOf,
} from "@/db/payment-store";
import { getD1, getRuntimeEnv } from "@/db/quiz-store";
import { fulfillSession } from "@/lib/payment-fulfillment";
import { PaymentError, paymentError, privateJson, requireSameOrigin } from "@/lib/payment-http";
import { readProfileId } from "@/lib/profile-cookie";
import { checkoutOrigin, paymentConfig, stripeClient } from "@/lib/stripe";
import { orderRefundPolicy, LEGACY_REFUND_POLICY } from '@/lib/refund-policy';

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json() as {
      reportId?: string;
      expectedAmountCents?: number;
      expectedRefundPolicy?: string;
      tier?: string;
    };
    if (typeof body.reportId !== "string") throw new PaymentError("Choose a report first.");
    const report = await ownedReport(body.reportId, readProfileId(request), request);
    const limiter = getRuntimeEnv().CHECKOUT_RATE_LIMIT;
    if (limiter && !(await limiter.limit({ key: `checkout:${report.profile_id}` })).success) {
      return new Response(JSON.stringify({ error: 'Too many checkout attempts. Please wait one minute and try again.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': '60' } });
    }
    const config = paymentConfig();
    const deep = body.tier === "deep";
    const basic = await reportOrder(report.id);
    const previous = deep ? await deepOrder(report.id) : basic;
    if (previous && Boolean(previous.livemode) !== !config.sandbox) throw new PaymentError("Please take a new test in this payment environment.", 409);
    if (!deep && (report.free || previous?.status === "paid")) return privateJson({ url: `/reports/${report.id}` });
    if (deep && previous?.status === "paid") return privateJson({ url: `/reports/${report.id}` });
    if (deep && !(report.free || basic?.status === "paid")) {
      throw new PaymentError("Unlock the full report first.", 409);
    }
    if (previous?.status === "refunded") throw new PaymentError("This purchase was refunded. Take a new test to purchase a new report.", 409);
    const amount = previous?.amount_cents ?? (deep ? currentDeepPrice() : await currentPrice(report));
    if (body.expectedAmountCents !== amount) throw new PaymentError("The price has changed. Refresh this page to see the current price.", 409);
    if (!deep && amount === 0) {
      await getD1().prepare("UPDATE quiz_reports SET free = 1 WHERE id = ?").bind(report.id).run();
      return privateJson({ url: `/reports/${report.id}` });
    }
    const refundPolicy = await orderRefundPolicy(previous?.id);
    if (body.expectedRefundPolicy !== refundPolicy) throw new PaymentError('The purchase terms have been updated. Refresh this page and review the refund policy before purchasing.', 409);
    if (!config.ready) throw new PaymentError("Checkout is not available yet. Please try again later.", 503);
    const stripe = stripeClient();
    const table = deep ? "deep_orders" as const : "payment_orders" as const;
    let order = deep
      ? await createDeepOrder(report, !config.sandbox, amount)
      : await createOrder(report, !config.sandbox, amount);
    if (await orderRefundPolicy(order.id) !== refundPolicy) throw new PaymentError('Refresh this page to review the terms for your existing order.', 409);
    if (order.amount_cents !== amount) throw new PaymentError("The price has changed. Refresh this page before purchasing.", 409);
    if (order.stripe_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (existing.status === "complete") {
        await fulfillSession(existing);
        return privateJson({ url: `/reports/${report.id}?payment=success${deep ? "&tier=deep" : ""}` });
      }
      if (existing.status === "open" && existing.url) return privateJson({ url: existing.url });
      await clearExpiredCheckout(order, existing.id, table);
      order = (deep ? await deepOrder(report.id) : await reportOrder(report.id))!;
    }
    const origin = checkoutOrigin(request);
    const title = snapshotOf(report).test.title;
    const session = await stripe.checkout.sessions.create({
      mode: "payment", payment_method_types: ["card"], customer_email: report.email,
      client_reference_id: order.id, metadata: { order_id: order.id, refund_policy: refundPolicy, tier: deep ? "deep" : "basic" },
      payment_intent_data: { metadata: { order_id: order.id, refund_policy: refundPolicy, tier: deep ? "deep" : "basic" } },
      custom_text: { submit: { message: refundPolicy === LEGACY_REFUND_POLICY
        ? 'This order retains our original 14-day refund request policy. Details: https://deeppersonaai.com/refunds/legacy-2026-09'
        : 'Digital report. No refunds after successful delivery for change of mind or subjective dissatisfaction. Exceptions apply for delivery failure, duplicate charges, material misdescription and legal rights. Details: https://deeppersonaai.com/refunds' } },
      line_items: [{ price_data: {
        currency: order.currency, unit_amount: order.amount_cents,
        product_data: { name: deep ? `${title} — Deep reading` : `${title} — Full report` },
      }, quantity: 1 }],
      success_url: `${origin}/reports/${report.id}?payment=success${deep ? "&tier=deep" : ""}`,
      cancel_url: `${origin}/reports/${report.id}?payment=cancelled`,
    }, { idempotencyKey: `${table}-${order.id}-${order.attempt}` });
    await saveCheckoutSession(order, session.id, table);
    if (!session.url) throw new PaymentError("Unable to open checkout.", 503);
    return privateJson({ url: session.url });
  } catch (error) { return paymentError(error); }
}
