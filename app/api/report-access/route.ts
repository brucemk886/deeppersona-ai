import { ensurePaymentSchema } from '@/db/payment-store';
import { getD1 } from '@/db/quiz-store';
import { tokenHash } from '@/lib/report-email';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const headers = { 'Cache-Control':'private, no-store', 'Referrer-Policy':'no-referrer', 'X-Robots-Tag':'noindex' };
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response('Invalid report link.', {status:400, headers});
  await ensurePaymentSchema();
  const record = await getD1().prepare(`SELECT e.report_id, e.expires_at FROM report_emails e JOIN payment_orders o ON o.report_id = e.report_id
    WHERE e.token_hash = ? AND e.expires_at > ? AND o.status = 'paid'`).bind(await tokenHash(token), Date.now()).first<{report_id:string; expires_at:number}>();
  if (!record) return new Response('This link has expired or the purchase is no longer available. Request another link from /recover or contact bruce@deeppersonaai.com.', {status:410, headers});
  await getD1().prepare('UPDATE report_emails SET first_access_at = COALESCE(first_access_at, ?) WHERE token_hash = ?').bind(Date.now(), await tokenHash(token)).run();
  return new Response(null, {status:303, headers:{...headers, Location:`/reports/${record.report_id}`, 'Set-Cookie':`dp_report_${record.report_id}=${token}; Path=/; Max-Age=${Math.floor((record.expires_at-Date.now())/1000)}; HttpOnly; Secure; SameSite=Lax`}});
}
