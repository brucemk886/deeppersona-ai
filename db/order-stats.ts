import { ensureTrafficSchema } from './traffic-store';
import { ensurePaymentSchema } from './payment-store';
import { getD1 } from './quiz-store';

export async function getOrderStats() {
  await ensurePaymentSchema();
  await ensureTrafficSchema();
  // Count confirmed live purchases by payment date, including subsequently refunded purchases.
  const rows = await getD1().prepare(`SELECT date(paid_at, '+8 hours') AS day, COUNT(*) AS orders
    FROM payment_orders WHERE livemode = 1 AND amount_cents > 0
    AND status IN ('paid', 'refunded') AND paid_at IS NOT NULL
    AND substr(id, 1, 8) != 'preview_'
    AND NOT EXISTS (SELECT 1 FROM quiz_reports r JOIN admin_test_sessions f ON f.session_id=r.session_id WHERE r.id=payment_orders.report_id)
    AND date(paid_at, '+8 hours') >= date('now', '+8 hours', '-13 days')
    AND date(paid_at, '+8 hours') <= date('now', '+8 hours')
    GROUP BY date(paid_at, '+8 hours')`).all<{ day: string; orders: number }>();
  const counts = new Map(rows.results.map(row => [row.day, row.orders]));
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - 13 + index);
    const day = date.toISOString().slice(0, 10);
    return { day, orders: counts.get(day) ?? 0 };
  });
  return { days, today: days[13].orders, yesterday: days[12].orders,
    lastSeven: days.slice(7).reduce((sum, day) => sum + day.orders, 0),
    previousSeven: days.slice(0, 7).reduce((sum, day) => sum + day.orders, 0) };
}
