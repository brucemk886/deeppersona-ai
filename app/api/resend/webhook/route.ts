import { Webhook } from 'svix';
import { ensurePaymentSchema } from '@/db/payment-store';
import { getD1, getRuntimeEnv } from '@/db/quiz-store';
import { privateJson, paymentError } from '@/lib/payment-http';

export const dynamic = 'force-dynamic';
const states = new Set(['sent', 'delivered', 'delivery_delayed', 'bounced', 'complained', 'failed', 'suppressed']);

export async function POST(request: Request) {
  const secret = getRuntimeEnv().RESEND_WEBHOOK_SECRET;
  if (!secret) return privateJson({ error: 'Webhook unavailable' }, 503);
  // Bound the body before signature verification; never log email content or private links.
  const reader = request.body?.getReader();
  if (!reader) return privateJson({ error: 'Missing payload' }, 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) { await reader.cancel(); return privateJson({ error: 'Payload too large' }, 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let event: { type: string; created_at: string; data: { email_id: string; from?: string; failed?: { reason?: string }; bounce?: { type?: string; subType?: string } } };
  const eventId = request.headers.get('svix-id') || '';
  try {
    const payload = new TextDecoder().decode(bytes);
    new Webhook(secret).verify(payload, {
      'svix-id': eventId,
      'svix-timestamp': request.headers.get('svix-timestamp') || '',
      'svix-signature': request.headers.get('svix-signature') || '',
    });
    event = JSON.parse(payload) as typeof event;
  } catch { return privateJson({ error: 'Invalid signature' }, 400); }
  const state = typeof event?.type === 'string' ? event.type.replace(/^email\./, '') : '';
  if (!states.has(state)) return privateJson({ received: true });
  if (!event.data || typeof event.data.email_id !== 'string' || event.data.email_id.length > 100 || !Number.isFinite(Date.parse(event.created_at))) {
    return privateJson({ error: 'Invalid event' }, 400);
  }
  // The Resend account also serves another website. Ignore its mail entirely.
  if (!/(?:^|<)reports@mail\.deeppersonaai\.com>?$/i.test(event.data.from || '')) return privateJson({ received: true });
  const code = event.data.failed?.reason || [event.data.bounce?.type, event.data.bounce?.subType].filter(Boolean).join(':');
  const reason = typeof code === 'string' && /^[a-zA-Z0-9_: -]{1,160}$/.test(code) ? code : null;
  try {
    await ensurePaymentSchema();
    // Store before the send response can finish: callbacks may arrive before resend_id is saved.
    // Event timestamps and terminal-state guards make duplicate/out-of-order notifications safe.
    await getD1().prepare(`INSERT INTO report_email_delivery (resend_id, status, occurred_at, event_id, reason, received_at)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(resend_id) DO UPDATE SET
      status = excluded.status, occurred_at = excluded.occurred_at, event_id = excluded.event_id,
      reason = excluded.reason, received_at = excluded.received_at
      WHERE excluded.occurred_at >= report_email_delivery.occurred_at
      AND excluded.event_id != report_email_delivery.event_id
      AND NOT (report_email_delivery.status IN ('bounced', 'complained', 'failed', 'suppressed') AND excluded.status IN ('sent', 'delivered', 'delivery_delayed'))
      AND NOT (report_email_delivery.status = 'delivered' AND excluded.status IN ('sent', 'delivery_delayed'))`)
      .bind(event.data.email_id, state, Date.parse(event.created_at), eventId, reason, Date.now()).run();
    return privateJson({ received: true });
  } catch (error) { return paymentError(error); }
}
