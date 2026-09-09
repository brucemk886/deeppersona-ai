import { getD1 } from '@/db/quiz-store';

export const CURRENT_REFUND_POLICY = 'limited-2026-09-08';
export const LEGACY_REFUND_POLICY = '14-day-2026-09-08';
export async function orderRefundPolicy(orderId?: string) {
  if (!orderId) return CURRENT_REFUND_POLICY;
  const saved = await getD1().prepare('SELECT version FROM payment_order_policies WHERE order_id = ?').bind(orderId).first<{version: string}>();
  return saved?.version || LEGACY_REFUND_POLICY;
}
