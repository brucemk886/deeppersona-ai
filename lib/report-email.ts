import { getD1, getRuntimeEnv } from '@/db/quiz-store';
import { ensurePaymentSchema } from '@/db/payment-store';

export async function tokenHash(token: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
}

export async function enqueueReportEmail(reportId: string, id: string, resend = false, blockDelivered = false) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const inserted = await getD1().prepare(`INSERT OR IGNORE INTO report_emails (id, report_id, token_hash, token, created_at, expires_at)
    SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM payment_orders WHERE report_id = ? AND status = 'paid')
    AND (? = 0 OR NOT EXISTS (SELECT 1 FROM report_emails WHERE report_id = ? AND created_at > ?))
    AND (? = 0 OR NOT EXISTS (SELECT 1 FROM report_emails e JOIN report_email_delivery d ON d.resend_id = e.resend_id WHERE e.report_id = ? AND d.status = 'delivered'))`)
    .bind(id, reportId, await tokenHash(token), token, now, now + 180 * 86400000, reportId, resend ? 1 : 0, reportId, now - 300000, blockDelivered ? 1 : 0, reportId).run();
  return Boolean(inserted.meta?.changes);
}

type MailJob = { id: string; report_id: string; token: string; attempts: number; created_at: number; email: string; title: string; livemode: number; status: string };

// Dedicated scheduled Worker processes a durable outbox independently of payment responses.
export async function processReportEmails() {
  const env = getRuntimeEnv();
  if (!env.RESEND_API_KEY || !env.REPORT_EMAIL_FROM) return;
  await ensurePaymentSchema();
  const now = Date.now();
  const jobs = await getD1().prepare(`SELECT e.*, r.email, json_extract(r.snapshot_json, '$.test.title') AS title, o.livemode
    FROM report_emails e JOIN quiz_reports r ON r.id = e.report_id JOIN payment_orders o ON o.report_id = e.report_id
    WHERE e.status IN ('pending', 'retry') AND e.next_attempt <= ? AND e.lease_until < ? AND e.attempts < 10
    AND o.status = 'paid' ORDER BY e.created_at LIMIT 50`).bind(now, now).all<MailJob>();
  await getD1().prepare('DELETE FROM report_email_limits WHERE expires_at < ?').bind(now).run();
  for (const job of jobs.results) {
    if (job.attempts > 0 && Date.now() - job.created_at > 20 * 3600000) {
      await getD1().prepare("UPDATE report_emails SET status = 'failed', error = 'retry_window_expired' WHERE id = ?").bind(job.id).run();
      continue;
    }
    const claimed = await getD1().prepare(`UPDATE report_emails SET lease_until = ?, attempts = attempts + 1
      WHERE id = ? AND lease_until < ? AND status IN ('pending', 'retry')`).bind(now + 60000, job.id, now).run();
    if (!claimed.meta?.changes) continue;
    try {
      // Do not send to fake customer addresses from sandbox payments in production.
      if (!job.livemode) {
        await getD1().prepare("UPDATE report_emails SET status = 'sandbox_skipped', lease_until = 0 WHERE id = ?").bind(job.id).run();
        continue;
      }
      await new Promise(resolve => setTimeout(resolve, 550));
      const origin = new URL(env.APP_URL || 'https://deeppersonaai.com').origin;
      const link = `${origin}/api/report-access?token=${job.token}`;
      const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
      const title = job.title || 'Your personal reflection';
      const body = { from: env.REPORT_EMAIL_FROM, to: [job.email], reply_to: 'bruce@deeppersonaai.com',
        subject: 'Your DeepPersona AI report is unlocked',
        text: `Your report is ready: ${title}\n\nView your report: ${link}\n\nThis private link works on another browser and is valid for 180 days. Keep it private. You can request a new link on our website. No further payment is required for this purchase.\nOrder report reference: ${job.report_id}\nSupport: bruce@deeppersonaai.com\nDeepPersona AI is operated by NEXUS FRONTIER LLC. For self-reflection, not clinical diagnosis.`,
        html: `<h1>Your report is unlocked</h1><p>${escape(title)}</p><p><a href="${escape(link)}">View my report</a></p><p>No further payment is required for this purchase. This private link works on another browser and is valid for 180 days. Keep it private. You can request a new link on our website.</p><p>Report reference: ${escape(job.report_id)}</p><p>Need help? Reply to this email.</p><p>DeepPersona AI · NEXUS FRONTIER LLC<br>For self-reflection, not clinical diagnosis.</p>` };
      const response = await fetch('https://api.resend.com/emails', {method:'POST', headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json', 'Idempotency-Key':`report/${job.id}`}, body:JSON.stringify(body), signal:AbortSignal.timeout(12000)});
      if (!response.ok) {
        const failure = await response.json().catch(() => ({})) as { name?: string };
        const code = typeof failure.name === 'string' && /^[a-z_]{1,80}$/.test(failure.name) ? ':' + failure.name : '';
        throw new Error(`resend_http_${response.status}${code}`);
      }
      const result = await response.json() as {id?: string};
      if (!result.id) throw new Error('resend_missing_id');
      await getD1().prepare("UPDATE report_emails SET status = 'accepted', resend_id = ?, sent_at = ?, lease_until = 0, error = NULL WHERE id = ?").bind(result.id, Date.now(), job.id).run();
    } catch (error) {
      const reason = error instanceof Error && /^resend_/.test(error.message) ? error.message : 'send_failed';
      // Stop before Resend's 24-hour idempotency window expires; manual resends get a fresh job.
      const exhausted = job.attempts >= 9 || Date.now() - job.created_at > 20 * 3600000;
      await getD1().prepare('UPDATE report_emails SET status = ?, error = ?, next_attempt = ?, lease_until = 0 WHERE id = ?')
        .bind(exhausted ? 'failed' : 'retry', reason, Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts), job.id).run();
    }
  }
}
