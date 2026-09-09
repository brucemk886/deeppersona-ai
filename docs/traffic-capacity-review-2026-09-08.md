# Traffic and capacity review — 2026-09-08

## Shipped scope
- Anonymous page counts only, no analytics visitor cookies and no GA script/consent panel. Refresh counts again; counts are not unique people and cannot filter internal views retrospectively.
- 14-day test cohorts in Asia/Shanghai; completion inferred from email-gate arrival or saved submission, never a single answer. Submission and live payment counts use saved records.
- Campaign/source/content grouping, same-origin referral mapped to unknown for legacy sessions. Incoming attribution is carried into test detail links; new session metadata stored separately. No claim of cross-device or unique-person attribution.
- Session-level test flag reversible in email users. Excluded from business statistics and order metrics. Soft deletion only hides mailbox rows, does not change traffic conversion history.
- Per-owner Cloudflare checkout limit 30/minute; returns 429 + Retry-After. Local to Cloudflare location, not a global anti-fraud guarantee. A client that starts new identities can bypass this layer; no Turnstile deployed.
- Schema setup cached per isolate with retry after errors, reducing repeat DDL requests.

## Validation
19 automated checks passed including amount/signature/replay/refund protection, test flag filtering, anonymous event idempotency and checkout throttling.
Local workerd with temporary D1, no external Stripe/mail: 50 simultaneous API journeys, 0 errors, p95 ~1263ms. Local binary supports 2026-05-22 compatibility date; production config is 2026-08-16. This is not production performance.
Production read-only probe: one burst each at concurrency 1/5/10/20/50 (86 total requests), no writes/payment/mail. All succeeded; 50-burst p95 ~1151ms. Single client network, no sustained soak, US mobile rendering or production write/payment concurrency tested. Raw results in outputs/isolated-load-20260908.json and outputs/production-read-probe-20260908.json.

## Unresolved
Cloudflare Worker usage_model=standard; subscriptions API returns 403. User subsequently confirmed Workers Paid. Official Standard allowance is 10 million requests/month with metered overage; D1 Paid includes 25 billion rows read and 50 million rows written/month. This does not imply unlimited instantaneous throughput. D1 database is shared by all sessions and can queue/reject overload; no defensible maximum concurrent-user number established.
User chose new reports free after a daily sales threshold, but threshold not yet supplied. No cap/free-switch implementation or live setting is enabled; this is pending. A paid-count-only switch permits outstanding checkouts to complete above the threshold, so a strict cap would need reservations/expiry reconciliation. Never silently remove access from existing purchases.
Stripe has no published safe 100-orders/day threshold. Volume controls do not guarantee avoidance of review/reserves. Radar/dashboard rules were not changed. Review decline/dispute/delivery health before traffic expansion.

Sources: https://developers.cloudflare.com/workers/platform/limits/ ; https://developers.cloudflare.com/d1/platform/limits/ ; https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ ; https://docs.stripe.com/radar/risk-settings
