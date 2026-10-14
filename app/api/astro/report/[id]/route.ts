import { ownedReport, reportOrder } from "@/db/payment-store";
import { fulfillSession } from "@/lib/payment-fulfillment";
import { PaymentError, paymentError, privateJson } from "@/lib/payment-http";
import { readProfileId } from "@/lib/profile-cookie";
import { providerConfig } from "@/lib/payment-config";
import { stripeClient } from "@/lib/stripe";
import { ASTRO_TEST_ID, PLANS, planForAmount, projectReading, type Access, type AstroSnapshot } from "@/lib/astro";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await ownedReport(id, readProfileId(request), request);
    if (report.test_id !== ASTRO_TEST_ID) throw new PaymentError("Report not found.", 404);
    let order = await reportOrder(report.id);
    // After Stripe redirects back, confirm the session directly in case the webhook is still on its way.
    if (new URL(request.url).searchParams.get("sync") === "1" && order?.stripe_session_id && order.status === "pending") {
      try {
        const session = await stripeClient().checkout.sessions.retrieve(order.stripe_session_id);
        if (session.status === "complete") await fulfillSession(session);
        order = await reportOrder(report.id);
      } catch { /* The webhook remains the source of truth. */ }
    }
    const paid = order?.status === "paid" ? planForAmount(order.amount_cents) : null;
    const access: Access = paid ?? "free";
    const snapshot = JSON.parse(report.snapshot_json) as AstroSnapshot;
    return privateJson({
      id: report.id,
      access,
      orderStatus: order?.status ?? null,
      checkoutReady: providerConfig("stripe").ready,
      plans: PLANS,
      reading: projectReading(snapshot, access),
    });
  } catch (error) { return paymentError(error); }
}
