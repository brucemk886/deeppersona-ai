import { ensurePaymentSchema } from '@/db/payment-store';
import { getD1 } from '@/db/quiz-store';
import { enqueueReportEmail, tokenHash } from '@/lib/report-email';
import { requireSameOrigin, privateJson, paymentError } from '@/lib/payment-http';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json() as { email?: string };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || email.length > 254 || !email.includes('@')) return privateJson({error:'Enter a valid email address.'},400);
    await ensurePaymentSchema();
    const hour = Math.floor(Date.now() / 3600000);
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    const bucket = `${hour}:${await tokenHash(ip)}`;
    const limit = await getD1().prepare(`INSERT INTO report_email_limits (bucket,hits,expires_at) VALUES (?,1,?)
      ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1 RETURNING hits`).bind(bucket, Date.now()+7200000).first<{hits:number}>();
    if ((limit?.hits || 0) > 20) return privateJson({error:'Too many requests. Please try again later.'},429);
    const rows = await getD1().prepare(`SELECT r.id FROM quiz_reports r JOIN payment_orders o ON o.report_id = r.id
      WHERE lower(r.email) = ? AND o.status = 'paid' AND o.livemode = 1 ORDER BY o.created_at DESC LIMIT 10`).bind(email).all<{id:string}>();
    for (const row of rows.results) await enqueueReportEmail(row.id, crypto.randomUUID(), true);
    return privateJson({message:'If this email has eligible paid reports, we will send the links shortly. Check your spam folder too. Please allow five minutes before requesting again.'});
  } catch(error) { return paymentError(error); }
}
