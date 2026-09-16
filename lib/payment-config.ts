import { getRuntimeEnv } from '@/db/quiz-store';
import { paymentConfig as stripeConfig } from './stripe';

export function paymentConfig() {
  const env = getRuntimeEnv();
  if (env.PAYMENT_PROVIDER !== 'lemonsqueezy') return { provider: 'stripe' as const, ...stripeConfig() };
  return {
    provider: 'lemonsqueezy' as const,
    sandbox: env.LEMONSQUEEZY_TEST_MODE !== 'false',
    ready: Boolean(env.LEMONSQUEEZY_API_KEY && env.LEMONSQUEEZY_WEBHOOK_SECRET &&
      env.LEMONSQUEEZY_STORE_ID && env.LEMONSQUEEZY_VARIANT_ID && env.LEMONSQUEEZY_DEEP_VARIANT_ID),
  };
}
