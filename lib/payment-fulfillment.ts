import type Stripe from "stripe";
import { getD1 } from "@/db/quiz-store";
import { ensurePaymentSchema, type OrderRow } from "@/db/payment-store";
import { PaymentError } from "./payment-http";
import { stripeClient } from "./stripe";
import { enqueueReportEmail } from './report-email';

// Used by both the signed webhook and the authenticated return page.
// Conditional updates are idempotent and never resurrect a refunded order.
export async function fulfillSession(session: Stripe.Checkout.Session) {
  await ensurePaymentSchema();
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  const order = await getD1().prepare("SELECT * FROM payment_orders WHERE id = ?").bind(orderId).first<OrderRow>();
  if (!order) throw new PaymentError("Order not found.", 409);
  if (session.id !== order.stripe_session_id || session.mode !== "payment" ||
      session.amount_total !== order.amount_cents || session.currency !== order.currency ||
      session.livemode !== Boolean(order.livemode) || session.client_reference_id !== order.id) {
    throw new PaymentError("Payment does not match this order.", 409);
  }
  if (session.payment_status !== "paid") return;
  const intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!intentId) throw new PaymentError("Missing payment confirmation.", 409);
  // A refund can arrive before a delayed completed event. Check the source of truth.
  const intent = await stripeClient().paymentIntents.retrieve(intentId, { expand: ["latest_charge"] });
  const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  const refunded = Boolean(charge && charge.amount_refunded >= order.amount_cents);
  await getD1().prepare(`UPDATE payment_orders SET status = ?, payment_intent_id = ?,
    paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status NOT IN ('refunded')`)
    .bind(refunded ? "refunded" : "paid", intentId, order.id).run();
  await enqueueReportEmail(order.report_id, `purchase-${order.id}`);
}
