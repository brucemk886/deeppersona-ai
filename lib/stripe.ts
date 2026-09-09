import Stripe from "stripe";
import { getRuntimeEnv } from "@/db/quiz-store";
import { PaymentError } from "./payment-http";

export function stripeClient() {
  const key = getRuntimeEnv().STRIPE_SECRET_KEY;
  if (!key) throw new PaymentError("Checkout is not available yet. Please try again later.", 503);
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient((url, init) => fetch(url, { ...init, cache: "no-store" })),
    maxNetworkRetries: 1, timeout: 10000,
  });
}

export function paymentConfig() {
  const env = getRuntimeEnv();
  return {
    sandbox: !env.STRIPE_SECRET_KEY || /^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY),
    ready: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
  };
}

export function checkoutOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  if (paymentConfig().sandbox && ["localhost", "127.0.0.1"].includes(requestUrl.hostname)) return requestUrl.origin;
  return new URL(getRuntimeEnv().APP_URL || "https://deeppersonaai.com").origin;
}

export async function verifiedStripeEvent(request: Request) {
  const secret = getRuntimeEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new PaymentError("Webhook is not configured.", 503);
  try {
    return await stripeClient().webhooks.constructEventAsync(
      await request.text(), request.headers.get("stripe-signature") || "", secret,
      undefined, Stripe.createSubtleCryptoProvider(),
    );
  } catch { throw new PaymentError("Invalid webhook signature.", 400); }
}
