import { isAdminRequest } from '@/app/admin-auth';
import { ensurePaymentSchema } from '@/db/payment-store';
import { getD1, getRuntimeEnv } from '@/db/quiz-store';
import { enqueueReportEmail } from '@/lib/report-email';
import { paymentError, privateJson, requireSameOrigin } from '@/lib/payment-http';

export const dynamic = 'force-dynamic';
const source = `FROM report_emails e JOIN quiz_reports r ON r.id = e.report_id
  JOIN payment_orders o ON o.report_id = e.report_id
  LEFT JOIN report_email_delivery d ON d.resend_id = e.resend_id`;
const state = `COALESCE(d.status, e.status)`;
const attention = `${state} IN ('retry', 'failed', 'bounced', 'complained', 'suppressed', 'delivery_delayed')`;

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return privateJson({ error: 'Unauthorized' }, 401);
  try {
    await ensurePaymentSchema();
    const url = new URL(request.url);
    const search = (url.searchParams.get('q') || '').trim().slice(0, 254);
    const page = Math.max(1, Math.min(100000, Math.floor(Number(url.searchParams.get('page')) || 1)));
    const filter = url.searchParams.get('status') || 'all';
    const filters: Record<string, string> = {
      all: '1=1', attention, delivered: `${state} = 'delivered'`,
      pending: `${state} IN ('pending','retry')`, accepted: `${state} IN ('sent','accepted')`,
      failed: `${state} IN ('failed','bounced','suppressed','complained')`,
    };
    const where = `WHERE ${filters[filter] || filters.all} AND (? = '' OR instr(lower(r.email), lower(?)) > 0 OR instr(e.report_id, ?) > 0)`;
    const db = getD1();
    const results = await db.batch([
      db.prepare(`SELECT e.id, e.report_id, e.status AS send_status, ${state} AS status, e.attempts,
        e.resend_id, e.error, d.reason, d.received_at AS delivery_updated_at, e.created_at, e.sent_at,
        e.next_attempt, e.first_access_at, r.email, json_extract(r.snapshot_json, '$.test.title') AS test_title,
        o.id AS order_id, o.status AS order_status, o.livemode,
        EXISTS(SELECT 1 FROM report_emails previous JOIN report_email_delivery receipt ON receipt.resend_id = previous.resend_id
          WHERE previous.report_id = e.report_id AND receipt.status = 'delivered') AS already_delivered
        ${source} ${where} ORDER BY e.created_at DESC, e.id DESC LIMIT 30 OFFSET ?`)
        .bind(search, search, search, (page - 1) * 30),
      db.prepare(`SELECT COUNT(*) AS total ${source} ${where}`).bind(search, search, search),
      db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(${attention}),0) AS attention,
        COALESCE(SUM(${state} = 'delivered'),0) AS delivered,
        COALESCE(SUM(${state} IN ('pending','retry')),0) AS pending ${source}`),
    ]);
    return privateJson({ rows: results[0].results, total: (results[1].results[0] as { total: number }).total, page,
      summary: results[2].results[0] as { total: number; attention: number; delivered: number; pending: number }, webhookConfigured: Boolean(getRuntimeEnv().RESEND_WEBHOOK_SECRET) });
  } catch (error) { return paymentError(error); }
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return privateJson({ error: 'Unauthorized' }, 401);
  try {
    requireSameOrigin(request);
    const { reportId } = await request.json() as { reportId?: string };
    if (typeof reportId !== 'string' || reportId.length > 100) return privateJson({ error: '请选择报告。' }, 400);
    await ensurePaymentSchema();
    const order = await getD1().prepare("SELECT 1 FROM payment_orders WHERE report_id = ? AND status = 'paid' AND livemode = 1").bind(reportId).first();
    if (!order) return privateJson({ error: '仅可补发已付款的正式报告，已退款或沙盒订单不能补发。' }, 409);
    const delivered = await getD1().prepare("SELECT 1 FROM report_emails e JOIN report_email_delivery d ON d.resend_id = e.resend_id WHERE e.report_id = ? AND d.status = 'delivered' LIMIT 1").bind(reportId).first();
    if (delivered) return privateJson({ error: '此报告已发布成功，无需再次补发。' }, 409);
    const queued = await enqueueReportEmail(reportId, crypto.randomUUID(), true, true);
    return privateJson({ queued, message: queued ? '已加入发送队列，稍后刷新查看结果。' : '五分钟内已有发送任务，请稍后再补发。' }, queued ? 200 : 429);
  } catch (error) { return paymentError(error); }
}
