import { getD1 } from "./quiz-store";
import { ensurePaymentSchema, reportOrder, type OrderRow } from "./payment-store";
import { CURRENT_REFUND_POLICY } from "@/lib/refund-policy";
import { PLANS, type PlanId } from "@/lib/astro";

// Astro orders reuse payment_orders. The plan is the order amount (499 basic, 999 full),
// so the existing webhook, fulfillment, refund and email flows work without a migration.
export async function createAstroOrder(reportId: string, plan: PlanId, livemode: boolean): Promise<OrderRow> {
  await ensurePaymentSchema();
  const existing = await reportOrder(reportId);
  if (existing) return existing;
  const id = crypto.randomUUID();
  await getD1().batch([
    getD1().prepare("INSERT OR IGNORE INTO payment_orders (id, report_id, amount_cents, livemode) VALUES (?, ?, ?, ?)")
      .bind(id, reportId, PLANS[plan].cents, livemode ? 1 : 0),
    getD1().prepare("INSERT OR IGNORE INTO payment_order_policies (order_id, version) SELECT ?, ? WHERE EXISTS (SELECT 1 FROM payment_orders WHERE id = ?)")
      .bind(id, CURRENT_REFUND_POLICY, id),
  ]);
  return (await reportOrder(reportId))!;
}

// Switch an unpaid order to another plan. The caller must expire any open Stripe session first.
export async function switchAstroPlan(order: OrderRow, plan: PlanId): Promise<OrderRow> {
  await getD1().prepare(`UPDATE payment_orders SET amount_cents = ?, stripe_session_id = NULL, attempt = attempt + 1,
    status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status NOT IN ('paid', 'refunded')`)
    .bind(PLANS[plan].cents, order.id).run();
  return (await reportOrder(order.report_id))!;
}
