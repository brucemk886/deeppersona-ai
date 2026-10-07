# Attachment first traffic edition — 2026-10-07

## Goal
Ship the user's approved first version before traffic acquisition, then use observed funnel losses to prioritize the next question iteration. This implements the independent-site quiz/report phase, not the later TikTok creative or account-routing decisions.

## Decisions
- Twenty English everyday scenarios across five areas; all questions required, closest response instruction. No skip is advertised. Public D1 catalog remains authoritative.
- New IDs `attachment-style-launch-v1-q01` through `q20` and report version `attachment-launch-v1`. Stable per-session option shuffle saves canonical indexes, not display letters.
- New reports show actual response counts, answer evidence, context differences and one immediate action. Ties and one-answer margins use a mixed/context-dependent headline. No clinical score conversion, self-worth percentages, or unsupported childhood conclusions.
- Optional USD 9.99 complete report: five areas, three selected situations with concrete scripts/conditions/observations, all answers and one practice. Deterministic editorial composition from actual answers; no AI generation dependency. New reports cannot buy the legacy second tier. Historical snapshots and base/deep purchase rights remain readable and unchanged.
- Paid copy is server-only and excluded from free responses and client bundles. Existing refund, payment confirmation, report recovery and delivery mechanisms remain in place.
- First-party aggregate funnel adds edition cohorts, actual rendered result view, checkout navigation click and paid report open. These are separate observed stages: a checkout click does not prove provider-page arrival. Payment remains server-confirmed. Per-question unanswered includes ongoing sessions; source/UTM attribution and test/sandbox exclusions remain.
- No Factory task creation, publishing schedule, email-alert setting, or account grouping changes.

## Files
- `lib/attachment-launch*.ts`: bank, client-safe types/shuffle, server report construction.
- `lib/deep-results.ts`, `lib/report-preview.ts`, `lib/payment-types.ts`: versioned snapshots and preview projection.
- `app/_components/attachment-launch-result.tsx`, free results, homepage, quiz app, layout and CSS: free/full report, purchase visibility, balanced instructions, mobile progress.
- Report/checkout routes and `db/traffic-stats.ts`, admin traffic panel: entitlement and funnel events/cohorts.
- `db/quiz-store.ts`: historical migrations frozen to their historical bank; new seeds cannot silently become an old migration.
- `db/releases/2026-10-07-attachment-launch-v1.sql`, generator: explicit scoped production rollout. Stages inactive rows, then switches active bank in a single guarded UPDATE. Keeps old rows, prices and report snapshots. Does not overwrite concurrently edited question text. A failed guard leaves the active bank intact and requires inspection, not a blind retry.

## Validation
- `npx tsc --noEmit` passed.
- `npm test`: build + 89 tests passed, including legacy Stripe/Lemon Squeezy purchase/refund regressions, new report authorization, full-report read restrictions, view-event deduplication, version funnel, exact choice evidence, ties, shuffle, migration idempotency/fail-closed behavior and absence of new paid scripts from client bundles.
- Isolated Miniflare browser preview: desktop free report; mobile free/full report and quiz; answer then back preserved shuffled order and canonical selected answer. Local fixtures only; no real payment or email sent.
- Screenshots/debug exports remain ignored under `work/`; they are not production customer samples. Local HTTP preview emits favicon HTTPS errors; no quiz/report failure observed.

## Release procedure
1. Review, commit and push `main`; require clean worktree with HEAD equal to origin/main.
2. Run `npm run deploy` (site's approved deploy-and-sync wrapper).
3. Run the explicit release SQL against `deeppersona-ai` D1; verify active_questions=20 and launch_questions=20, unchanged 999-cent price, and old questions retained inactive.
4. Verify public production catalog and UI. The deployment outcome is recorded in the task and ignored `work/deployed-site.json`.

## Follow-up
- Open admin → 流量分析. Use 首轮 V1 cohort and the per-question version selector. V1 starts accumulating at release; old view/click events cannot be reconstructed.
- Keep this question edition steady while the first traffic arrives. Examine starts, question reach/answers, email submission, result viewing, checkout navigation, server-confirmed payment and paid report opening by source. Unanswered is not automatically abandonment and pageviews are not unique people.
- For substantive next-edition wording changes, create new question IDs/report version and preserve prior snapshots rather than blending cohorts. Admin can still edit the managed catalog; arbitrary rewritten prompts fall back to a generic script instead of receiving an unrelated old scenario script.
- Next business steps: first acquisition creatives, then actual TikTok One eligibility/direct-link/profile routing for the stated account inventory. Those are not validated or launched by this release.

## Follow-up copy refinement (2026-10-07)
- User requested combining repeated phone checking with repeated follow-up messages. V1 Q1's reassurance option is now: "I keep checking my phone, then keep sending follow-up texts until they reply."
- Update the default bank and apply `db/releases/2026-10-07-attachment-phone-followups.sql` to the managed live catalog. This guard matches the expected prior text and semantic style; it preserves other options, scoring and historical report snapshots. Newly created reports quote the new selected text automatically.
- Keep the original launch migration unchanged. This small requested copy refinement remains in the initial V1 cohort and is recorded here; it is not a separately measured experiment.
- Validation: existing launch/report tests and deployment type/build checks; verify the public catalog option after the explicit migration.
