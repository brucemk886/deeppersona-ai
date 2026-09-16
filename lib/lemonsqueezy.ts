import { getD1, getRuntimeEnv } from '@/db/quiz-store';
import { ensurePaymentSchema, findOrderById, type OrderRow, type ReportRow } from '@/db/payment-store';
import { PaymentError } from './payment-http';
import { enqueueReportEmail } from './report-email';

export type LemonPayment = {
  order_id: string; store_id: string; variant_id: string; nonce: string;
  checkout_id: string | null; checkout_url: string | null; expires_at: number;
  remote_order_id: string | null; lease_until: number; prepared: number;
};
type LemonOrder = { type: string; id: string; attributes: {
  store_id: number; currency: string; subtotal: number; discount_total: number;
  status: string; refunded: boolean; test_mode: boolean;
  first_order_item: { variant_id: number };
} };
type LemonEvent = { meta: { event_name: string; custom_data?: { order_id?: string; nonce?: string } }; data: LemonOrder };

// Provider errors can contain customer information; never forward their bodies.
export async function lemonRequest<T>(path: string, body?: unknown): Promise<T> {
  const key = getRuntimeEnv().LEMONSQUEEZY_API_KEY;
  if (!key) throw new PaymentError('Checkout is not configured.', 503);
  const response = await fetch(`https://api.lemonsqueezy.com/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new PaymentError('The payment service is temporarily unavailable. Please try again.', 503);
  return await response.json() as T;
}

export async function lemonPayment(orderId: string) {
  return getD1().prepare('SELECT * FROM lemon_payments WHERE order_id = ?').bind(orderId).first<LemonPayment>();
}

async function validatedLemonConfig(payment: LemonPayment, order: OrderRow) {
  const env = getRuntimeEnv();
  const material = [env.LEMONSQUEEZY_API_KEY, payment.store_id, payment.variant_id, !Boolean(order.livemode), order.currency].join(':');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  const cacheKey = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const cached = await getD1().prepare('SELECT valid_until FROM lemon_config_cache WHERE cache_key = ? AND valid_until > ?')
    .bind(cacheKey, now).first<{valid_until: number}>();
  if (cached) return;
  const [variantResponse, storeResponse] = await Promise.all([
    lemonRequest<{ data: { attributes: { is_subscription: boolean; test_mode: boolean } } }>(`variants/${payment.variant_id}`),
    lemonRequest<{ data: { attributes: { currency: string } } }>(`stores/${payment.store_id}`),
  ]);
  if (variantResponse.data.attributes.is_subscription || variantResponse.data.attributes.test_mode !== !Boolean(order.livemode) ||
      storeResponse.data.attributes.currency.toLowerCase() !== order.currency) {
    throw new PaymentError('The checkout product or payment environment is not configured correctly.', 503);
  }
  await getD1().prepare(`INSERT INTO lemon_config_cache (cache_key, valid_until) VALUES (?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET valid_until = excluded.valid_until, updated_at = CURRENT_TIMESTAMP`)
    .bind(cacheKey, now + 5 * 60 * 1000).run();
}

export async function markLemonCheckoutOpened(orderId: string) {
  await getD1().prepare('UPDATE lemon_payments SET prepared = 0 WHERE order_id = ?').bind(orderId).run();
}

export async function createLemonCheckout(order: OrderRow, report: ReportRow, deep: boolean, origin: string, policy: string, prepare = false) {
  const env = getRuntimeEnv();
  const variant = deep ? env.LEMONSQUEEZY_DEEP_VARIANT_ID : env.LEMONSQUEEZY_VARIANT_ID;
  if (!variant || !env.LEMONSQUEEZY_STORE_ID) throw new PaymentError('Checkout is not configured.', 503);
  await getD1().prepare(`INSERT OR IGNORE INTO lemon_payments (order_id, store_id, variant_id, nonce, prepared) VALUES (?, ?, ?, ?, ?)`)
    .bind(order.id, env.LEMONSQUEEZY_STORE_ID, variant, crypto.randomUUID(), prepare ? 1 : 0).run();
  if (!prepare) await markLemonCheckoutOpened(order.id);
  let payment = (await lemonPayment(order.id))!;
  if (payment.remote_order_id) {
    await syncLemonOrder(order, payment);
    return `/reports/${report.id}?payment=success${deep ? '&tier=deep' : ''}`;
  }
  if (payment.checkout_url && payment.expires_at > Date.now() + 10000) return payment.checkout_url;
  // Claim before calling the provider: two clicks must not create two payable checkouts.
  const claim = await getD1().prepare(`UPDATE lemon_payments SET lease_until = ? WHERE order_id = ? AND lease_until < ?`)
    .bind(Date.now() + 30000, order.id, Date.now()).run();
  if (!claim.meta?.changes) throw new PaymentError('Checkout is being prepared. Please try again in a few seconds.', 409);
  try {
    payment = (await lemonPayment(order.id))!;
    if (payment.checkout_url && payment.expires_at > Date.now() + 10000) return payment.checkout_url;
    await validatedLemonConfig(payment, order);
    const expires = Date.now() + 30 * 60 * 1000;
    const returnUrl = `${origin}/reports/${report.id}?payment=success${deep ? '&tier=deep' : ''}`;
    const result = await lemonRequest<{ data: { id: string; attributes: { url: string; test_mode: boolean } } }>('checkouts', { data: {
      type: 'checkouts', attributes: {
        custom_price: order.amount_cents, test_mode: !Boolean(order.livemode), expires_at: new Date(expires).toISOString(),
        product_options: {
          name: `${JSON.parse(report.snapshot_json).test.title} — ${deep ? 'Deep reading' : 'Full report'}`,
          description: `One-time purchase for this test result. No subscription. Refund and delivery policy: ${origin}/refunds${policy === '14-day-2026-09-08' ? '/legacy-2026-09' : ''}`,
          enabled_variants: [Number(payment.variant_id)], redirect_url: returnUrl,
          receipt_button_text: 'View your report', receipt_link_url: returnUrl,
        },
        checkout_options: { discount: false, subscription_preview: false, locale: 'en' },
        checkout_data: { email: report.email, custom: { order_id: order.id, nonce: payment.nonce, refund_policy: policy, tier: deep ? 'deep' : 'basic' },
          variant_quantities: [{ variant_id: Number(payment.variant_id), quantity: 1 }] },
      }, relationships: {
        store: { data: { type: 'stores', id: payment.store_id } },
        variant: { data: { type: 'variants', id: payment.variant_id } },
      },
    } });
    const url = new URL(result.data.attributes.url);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.lemonsqueezy.com') || result.data.attributes.test_mode !== !Boolean(order.livemode)) {
      throw new PaymentError('Invalid checkout response.', 503);
    }
    await getD1().prepare('UPDATE lemon_payments SET checkout_id = ?, checkout_url = ?, expires_at = ? WHERE order_id = ?')
      .bind(result.data.id, url.href, expires, order.id).run();
    return url.href;
  } finally {
    await getD1().prepare('UPDATE lemon_payments SET lease_until = 0 WHERE order_id = ?').bind(order.id).run();
  }
}

export async function verifiedLemonEvent(request: Request): Promise<LemonEvent> {
  const secret = getRuntimeEnv().LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) throw new PaymentError('Webhook is not configured.', 503);
  const signature = request.headers.get('x-signature') || '';
  if (!/^[a-f0-9]{64}$/i.test(signature)) throw new PaymentError('Invalid webhook signature.', 400);
  const raw = await request.text();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(signature.match(/../g)!, value => parseInt(value, 16));
  if (!await crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(raw))) throw new PaymentError('Invalid webhook signature.', 400);
  try { return JSON.parse(raw) as LemonEvent; } catch { throw new PaymentError('Invalid webhook payload.', 400); }
}

export async function syncLemonOrder(order: OrderRow, payment: LemonPayment) {
  if (!payment.remote_order_id) return;
  const { data } = await lemonRequest<{ data: LemonOrder }>(`orders/${encodeURIComponent(payment.remote_order_id)}`);
  const a = data.attributes;
  // Taxes may be added by the merchant of record. Match the USD subtotal, not the tax-inclusive total.
  if (data.type !== 'orders' || data.id !== payment.remote_order_id || String(a.store_id) !== payment.store_id ||
      String(a.first_order_item?.variant_id) !== payment.variant_id || a.currency?.toLowerCase() !== order.currency ||
      a.subtotal !== order.amount_cents || a.discount_total !== 0 || a.test_mode !== !Boolean(order.livemode)) {
    throw new PaymentError('Payment does not match this order.', 409);
  }
  const status = a.refunded || a.status === 'refunded' ? 'refunded'
    : a.status === 'fraudulent' ? 'failed' : ['paid', 'partial_refund'].includes(a.status) ? 'paid' : null;
  if (!status) return;
  await getD1().batch([
    getD1().prepare('UPDATE lemon_payments SET remote_order_id = ? WHERE order_id = ? AND (remote_order_id IS NULL OR remote_order_id = ?)')
      .bind(data.id, order.id, data.id),
    ...['payment_orders', 'deep_orders'].map(table => getD1().prepare(
    `UPDATE ${table} SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, CURRENT_TIMESTAMP) ELSE paid_at END,
      updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'refunded' AND stripe_session_id IS NULL
      AND EXISTS (SELECT 1 FROM lemon_payments WHERE order_id = ? AND remote_order_id = ?)`)
    .bind(status, status, order.id, order.id, data.id))]);
  if ((await lemonPayment(order.id))?.remote_order_id !== data.id) throw new PaymentError('Duplicate payment reference.', 409);
  if (status === 'paid' && (await findOrderById(order.id))?.status === 'paid') await enqueueReportEmail(order.report_id, `purchase-${order.id}`);
}

export async function fulfillLemonEvent(event: LemonEvent) {
  if (!['order_created', 'order_refunded'].includes(event.meta?.event_name)) return;
  await ensurePaymentSchema();
  const custom = event.meta.custom_data;
  const payment = custom?.order_id ? await lemonPayment(custom.order_id) :
    await getD1().prepare('SELECT * FROM lemon_payments WHERE remote_order_id = ?').bind(event.data.id).first<LemonPayment>();
  // Other store products can share this webhook. Only our server-created checkouts are eligible.
  if (!payment) return;
  if (!payment.remote_order_id && custom?.nonce !== payment.nonce) throw new PaymentError('Invalid order reference.', 409);
  if (payment.remote_order_id && payment.remote_order_id !== event.data.id) throw new PaymentError('Duplicate payment reference.', 409);
  const order = await findOrderById(payment.order_id);
  if (!order || order.stripe_session_id || !/^\d+$/.test(event.data.id)) throw new PaymentError('Invalid order reference.', 409);
  // The signed event binds the provider order to our private checkout nonce. Retrieve current state to handle out-of-order refunds.
  await syncLemonOrder(order, { ...payment, remote_order_id: event.data.id });
}
