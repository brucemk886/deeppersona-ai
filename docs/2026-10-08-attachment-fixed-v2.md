# Attachment fixed report V2 — 2026-10-08

## Goal and authorization
The owner approved the Chinese answer-mapping preview and explicitly authorized publication and corresponding backend changes. Ship the English quiz and predetermined report composition; no AI request at result creation or viewing.

## Product decisions
- Twenty questions: 14 current relationship reactions across five domains; two relationship-background, three family-background and one later-experience question. All have a not-applicable/uncertain option; the last also has no such experience. 101 stored options.
- Four authored main reports: anxious, avoidant, fearful-avoidant and secure. Background does not change the type. At least 10 valid core answers and five domains are needed. A leading pattern requires at least 40%, a two-answer margin and evidence in three domains. Otherwise show mixed or insufficient context; insufficient results have no purchase offer and the checkout API rejects payment. These are product-routing heuristics, not validated diagnostic cutoffs.
- Free: named tendency, 3–5 actual answer examples, behavior themes. Do not restore the rejected positive Q13 counterexample. Two detailed teaser sections (relationship risks, origins) precede the single purchase card. Teasers use separately authored copy; full paragraphs are never merely hidden by CSS.
- Full: selected relationship interactions, three relevant main-type risk chapters, selected family/later-experience interpretations, two deeper-pattern chapters, and the complete answer record at the bottom. No advice worksheets or conversation-script bundle.
- Avoidant origins follow the approved angle: repeated unsuccessful requests for needed support can teach someone to handle things alone and expect little from asking. The actual family answer must be selected. Skipped experiences are not inferred from type, and past self-reliance is not presented as a current fact when current answers do not support it.
- The managed one-time price remains unchanged. Production verification found USD 4.99; USD 9.99 in the review was a placeholder. The migration does not edit price. No second upgrade for V2. Prior snapshots and historical base/deep rights stay intact; the two retained complete earlier editions can finish after release.
- The US-facing site uses authored English. Chinese references in option metadata are for admin review only and are not shipped in public question responses.

## Backend
- D1 remains authoritative. New nullable `quiz_questions.report_config_json`, private per-option `fixed` metadata, and `quiz_report_templates` store the managed configuration. Code release data is migration input, not an on-read overwrite.
- Admin → 题目管理: active/edition filter, original choices, scoring tendency, fixed title/body/teaser. Existing stable IDs, tags, domain and question purpose cannot be reshuffled by edits within this edition. Same-origin and admin authorization required.
- Admin → 固定报告: four main templates, revision-checked updates, synthetic answer selection, free/full previews. Preview creates no user, report, payment or email. Draft report copy may be previewed; question changes must first be saved in question management.
- Frozen report records include rule/template versions, selected option IDs, selected answer text and actual interpretations. Later admin edits only affect later submissions.
- Admin → 流量分析: V2 cohort and question filter alongside V1/history. Existing attribution, actual page-view events and server-confirmed payments remain; no AI or claimed conversion improvement is implied.

## Files
- `lib/attachment-fixed*.ts`: public types/validation, server-only release content, deterministic report composer.
- `db/fixed-report-store.ts`, `db/quiz-store.ts`, question/admin/submit/report/checkout APIs: managed configuration, permissions, version completion, snapshot and payment handling.
- Fixed result component, free results, quiz app, homepage, CSS: quiz copy, preview order, full report and responsive display.
- Admin fixed reports panel/question editor and traffic files: editing, preview and V2 funnel cohort.
- Release generator and `db/releases/2026-10-08-attachment-fixed-v2.sql`: staged, guarded bank switch. A release-expectations table keeps every statement below D1's size limit; staging contains authored release text only and is cleared afterward.

## Validation
- TypeScript and build pass; complete regression suite: 101 passing tests.
- Tests cover all four types and all background options, skip/mixed/insufficient handling, actual choice evidence, family-source gating, public API/client-bundle exclusion of paid copy, immutable snapshots, concurrent admin revisions, same-origin/auth checks, preview side effects, one-payment rules/refunds, V1 completion and per-edition analytics.
- Migration tests: exact 20-row switch, idempotency, no historical report mutation, fail closed on edited/deleted live rows or edited staged rows. Tested against SQLite and actual isolated Miniflare D1. The initial oversized SQL guard was replaced before any production migration. Production preflight also demonstrated fail-closed behavior when the managed price differed from the review placeholder; the guard now accepts the existing nonnegative price without changing it.
- Browser QA: mobile quiz through all 20 choices; actual free/full result and admin components rendered with synthetic responses captured from isolated Worker APIs. Verified two previews before one purchase card, five evidence cards, 20 full-answer entries, no horizontal overflow, fixed-report preview and option editors; no browser exceptions. The combined Windows Miniflare SSR-to-submission browser run timed out, so component/browser checks and real API integration tests were run separately. Twelve concurrent direct event requests all passed. Screenshots stay under ignored `work/fixed-v2/`; no real checkout or email was triggered.

## Release and follow-up
1. Commit reviewed source, fetch/push main, verify clean HEAD equals origin/main, then `npm run deploy`.
2. Read the production catalog once to initialize compatible schema, then apply the explicit release SQL using Wrangler D1 execute. Verify 20 active fixed questions, 14 core / 6 context, unchanged managed price (499 cents at release) and old rows inactive.
3. Read-only production checks of public quiz, admin access protection and deployed assets. Deployment receipt stays in ignored `work/deployed-site.json`; record final release verification in the parent Local Factory handoff.
4. Review V2 starts, per-question reach/answer, email submission, result views, checkout clicks and confirmed purchases after real traffic arrives. An unanswered question is not necessarily abandonment. Further question/rule redesign should use a new edition rather than merge distinct cohorts.

No Factory schedule, publishing job, account pool, content pool or external alert changes are included. No further content decision is required for this approved release. Acquiring traffic and measuring actual conversion remain the next business steps.