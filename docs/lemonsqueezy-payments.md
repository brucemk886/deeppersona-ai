# Lemon Squeezy integration

The provider is selected explicitly with `PAYMENT_PROVIDER=lemonsqueezy`.
The default remains Stripe. Adding API credentials alone never switches production.

## Configuration

Use Cloudflare Secrets for the API key and webhook secret. Local values belong in
ignored `.dev.vars*` files, never Git. Required values are listed in `.env.example`:

- `LEMONSQUEEZY_API_KEY`: key for the intended test or live environment.
- `LEMONSQUEEZY_WEBHOOK_SECRET`: the signing secret configured on the webhook.
- `LEMONSQUEEZY_STORE_ID`: the intended USD store.
- `LEMONSQUEEZY_VARIANT_ID`: one-time full report variant.
- `LEMONSQUEEZY_DEEP_VARIANT_ID`: one-time deep reading variant.
- `LEMONSQUEEZY_TEST_MODE=true`: sandbox. Only explicit `false` selects live mode.
- `APP_URL`: the site's canonical origin, used for checkout return links.

Subscribe to `order_created` and `order_refunded` at
`/api/lemonsqueezy/webhook`, in the same environment as the API key and products.
Lemon Squeezy products and API keys have separate test/live environments.
One generic report variant may be used for both tiers; the server fixes the
checkout product name, quantity, tier and price. Subscription variants are rejected.

## Behaviour

- D1 remains authoritative for the basic report price; the existing deep price is
  unchanged. Created orders retain their original amount and refund policy.
- A separate `lemon_payments` table binds each internal order to the store,
  variant, private correlation nonce, checkout and provider order. Existing
  Stripe data and completed report snapshots are preserved.
- Existing Stripe checkout sessions continue through Stripe. Keep its credentials
  and webhook active for pending purchases and historical refunds.
- Checkout return URLs do not grant access. A raw-body HMAC signature is checked;
  the provider order is then fetched from the API and matched against local state.
- USD subtotal is checked separately from tax added by Lemon Squeezy. Discounts
  are disabled. Full refunds revoke the purchased tier. Duplicate or reordered
  notifications cannot create additional email jobs or restore refunded access.
- Both tiers enqueue delivery through the existing report email mechanism. The
  mail worker deliberately skips sandbox orders; an actual test purchase does
  not prove that a real report email was sent.
- Admin orders identify the payment provider and test/live environment.

## Local sandbox

Build first, then in PowerShell:

```powershell
$env:PAYMENT_ENV_FILE='.dev.vars.lemonsqueezy'
$env:PAYMENT_PERSIST='.wrangler/lemon-test'
$env:PAYMENT_PORT='8791'
node scripts/payment-preview.mjs
```

This uses a separate local database. The preview refuses a Lemon Squeezy config
unless test mode is explicitly true. Use an isolated signed-webhook endpoint for
external tests; never expose the entire local application to receive webhooks.

Run `npm run test` and `npx tsc --noEmit`. Payment integration tests exercise
ownership, frozen pricing, both tiers, wrong amounts/stores/variants/environments,
signature and nonce failures, duplicated events, refunds and Stripe compatibility.

## Before an explicitly approved live cutover

Verify live store/product approval, one-time USD variants, live API credentials and
live webhook delivery. Update Terms, Privacy, Refunds and checkout disclosures for
Lemon Squeezy's merchant-of-record role and applicable taxes, retaining historical
Stripe and refund-policy references where needed. No live cutover is implied by
completing a sandbox test. Deploy reviewed, committed code through `npm run deploy`
so the exact deployed source is synchronized with GitHub.
