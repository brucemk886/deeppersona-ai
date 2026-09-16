import { getD1, getRuntimeEnv } from '@/db/quiz-store';
import { ensurePaymentSchema, type OrderRow } from '@/db/payment-store';
import { paymentConfig as stripeConfig } from './stripe';

export type PaymentProvider = 'stripe' | 'lemonsqueezy';

export function providerConfig(provider: PaymentProvider) {
  const env = getRuntimeEnv();
  if (provider === 'stripe') return { provider, ...stripeConfig() };
  return {
    provider: 'lemonsqueezy' as const,
    sandbox: env.LEMONSQUEEZY_TEST_MODE !== 'false',
    ready: Boolean(env.LEMONSQUEEZY_API_KEY && env.LEMONSQUEEZY_WEBHOOK_SECRET &&
      env.LEMONSQUEEZY_STORE_ID && env.LEMONSQUEEZY_VARIANT_ID && env.LEMONSQUEEZY_DEEP_VARIANT_ID),
  };
}

export async function paymentSettings() {
  await ensurePaymentSchema();
  const row = await getD1().prepare('SELECT provider, updated_at FROM payment_settings WHERE id = 1')
    .first<{provider: PaymentProvider; updated_at: string}>();
  return { provider: row?.provider ?? (getRuntimeEnv().PAYMENT_PROVIDER === 'stripe' ? 'stripe' : 'lemonsqueezy'), updatedAt: row?.updated_at ?? null };
}

export async function paymentConfig(order?: OrderRow | null) {
  let provider = (await paymentSettings()).provider;
  // A switch affects new checkouts only. An existing checkout keeps its original processor.
  if (order?.stripe_session_id) provider = 'stripe';
  else if (order && await getD1().prepare('SELECT order_id FROM lemon_payments WHERE order_id = ?').bind(order.id).first()) provider = 'lemonsqueezy';
  return providerConfig(provider);
}
