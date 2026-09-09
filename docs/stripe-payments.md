# Stripe report payments

Reports are single purchases in USD. Prices come from **Admin → 测试管理**.
Zero is free; positive prices must be at least $0.50. Once checkout creates an
order, its price is fixed. A new test submission produces a new report, not a subscription.

## Local sandbox

1. Put sandbox credentials in ignored `.dev.vars`:

   ```dotenv
   STRIPE_SECRET_KEY=your-sandbox-secret
   STRIPE_WEBHOOK_SECRET=your-local-listener-signing-secret
   APP_URL=https://deeppersonaai.com
   ```

2. Start the official Stripe CLI listener forwarding to
   `http://127.0.0.1:8787/api/stripe/webhook`. Use a sandbox login or the
   `STRIPE_API_KEY` environment variable; do not paste secrets into command arguments.
   Save the listener's signing secret as `STRIPE_WEBHOOK_SECRET` before starting
   the app. The local listener secret is separate from a deployed endpoint secret.
3. Run `npm run build`, then `npm run dev:payments`. This uses the existing
   Miniflare runtime directly and persists **local-only** D1 data under
   `.wrangler/payment-dev`. It avoids Windows local-runtime stalls. Static files are served by Node; payment, webhook,
   and report routes run from the unchanged TypeScript source through a local
   SQLite/D1 adapter (`scripts/local-payment-routes.mjs`). Other routes still run
   in Miniflare. This adapter is local-only and is not included in the Worker build.
4. Open `http://127.0.0.1:8787`, finish a test, save an email, and purchase its report.
   Stripe's test card is `4242 4242 4242 4242`, with any future expiry and any
   three-digit CVC. Never enter a real card in the sandbox.
5. Verify the return page opens the full report; refresh it and replay the event.
   Also test cancellation and a full sandbox refund through Stripe.

`npm test` builds the application, checks existing site assertions, and runs the
payment integration suite against the actual Worker/D1 with a mock Stripe Worker.
It does not call Stripe or charge money. `npx tsc --noEmit` checks types.

## Deployment to the existing Cloudflare Worker

Use the established deployment workflow for the existing site. Before enabling
payments, apply the checked-in Drizzle migration `0006_absurd_agent_zero.sql` to
the intended D1 database using its migration workflow. Runtime schema creation is
also retained for compatibility with this project's existing database setup.
The new migration is idempotent if those two tables were already created at runtime.

Configure Worker Secrets `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` and the
nonsecret `APP_URL=https://deeppersonaai.com`. Register this Stripe destination:

`https://deeppersonaai.com/api/stripe/webhook`

Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`

First validate using sandbox credentials and a sandbox destination. For real
payments, use the live key and the **live endpoint's** signing secret together.
Sandbox purchases never unlock reports in live mode. No Stripe Product/Price IDs
are required: Checkout line items are created from the server's stored price.
The UI reports configuration presence, not verified webhook delivery health.

## Access and delivery

- `/api/submit` validates the complete answer set and calculates results server-side.
- Reports contain immutable content snapshots. Public test/question APIs and
  client bundles omit paid copy. Authenticated admin and content-sync APIs retain it.
- `/api/checkout` requires the owning profile cookie and same-origin requests.
- Both signed webhooks and authenticated return-page reconciliation validate the
  order, currency, amount and Stripe environment before unlocking. A success query
  parameter alone never grants access. Duplicate events are harmless.
- Full refunds revoke access; partial refunds retain it. A late completed event
  cannot restore a fully refunded purchase.
- Users can bookmark their report URL and print the unlocked report. Access is
  currently tied to the original browser's HttpOnly profile cookie. Cross-device
  email recovery and automatic report emails are **not implemented**. The page
  links to `bruce@deeppersonaai.com` for purchase support.
- Admin → 支付设置 shows configuration status and the latest 100 orders. Issue
  refunds in Stripe; the webhook updates local access.

No production deployment or live-mode transaction is performed by the automated tests.


## Refund policy versions
New orders record limited-2026-09-08 in payment_order_policies, atomically with order creation. Existing orders without a version retain the original 14-day policy archived at /refunds/legacy-2026-09. The report API supplies the version; checkout requires the displayed version to match and includes the notice in Stripe submit custom text and payment metadata. A changed policy requires refreshing before creating a charge session. This policy limits change-of-mind/subjective-dissatisfaction refunds after successful paid delivery; delivery failure, duplicate/incorrect charges, material misdescription, unauthorized payment and statutory remedies remain exceptions. Refunds remain handled by support; no automatic rejection of customer requests was implemented.
