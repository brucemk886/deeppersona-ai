# Attachment fixed report V2 — 2026-10-08

## Goal and authorization
The owner approved the Chinese answer-mapping preview and explicitly authorized publication and corresponding backend changes. Ship the English quiz and predetermined report composition; no AI request at result creation or viewing.

## Product decisions
- Twenty questions: 14 current relationship reactions across five domains; two relationship-background, three family-background and one later-experience question. The 14 scored questions have four choices. Only the six context questions retain a not-applicable/uncertain option; the last also has no such experience. 87 stored options after the same-day four-choice correction.
- Four authored main reports: anxious, avoidant, fearful-avoidant and secure. Background does not change the type. Current rules (`fixed-rules-v2`) select the highest core-answer count, with named close/tied tendencies and visible counts. Equal score vectors select the same report regardless of question positions. Exact ties use stable presentation order and explicitly state that neither tied pattern is stronger. The original 40% / two-answer / three-domain gate is retired for new reports. Legacy incomplete attempts still need 10 valid core answers and five covered domains; insufficient and thin legacy mixed readings cannot be purchased. These are product-routing rules, not validated diagnostic cutoffs.
- Free: prominent named type and summary, exactly three actual answer examples, then locked chapter openings and the single purchase card. Do not restore the rejected positive Q13 counterexample, duplicate trait summary, early green purchase link, or complete free paragraph sample. Locked previews begin the matching frozen paid chapter and stop before its full paragraph ends; the remaining body is never sent as CSS-hidden text.
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

## Same-day four-choice correction
The owner rejected the extra fifth answer on scored questions. Remove only the 14 core skip options; keep the first four option IDs, order, wording and scoring unchanged, and preserve all six background questions. The public helper no longer suggests skipping. Admin validation and preview presets follow the four-choice core bank.

Apply `db/releases/2026-10-08-attachment-core-four-options.sql` after the matching code deployment. It atomically removes the fifth option only when all 14 live rows match the expected core configuration, preserves managed wording, and is idempotent. The initial V2 release input remains historical and must not be reapplied over this correction.

Already-loaded five-option pages can finish when the selected fifth index is accompanied by its exact retired stable option ID; this compatibility is submission-only and does not reinsert options into the catalog. Existing report snapshots, historical editions, background interpretations, report templates and the managed price remain unchanged. All new completed quizzes have 14 scored answers. Existing mixed-pattern rules remain; legacy skip/insufficient handling remains for in-flight pages and old reports.

Validation: TypeScript check and all 104 tests pass, including real Worker/D1 submission, current four-choice admin editing, exact retired-ID compatibility, immutable existing reports, all four scoring types, and guarded migration safety.


## Result and purchase corrections after user QA
The owner reported vague mixed results, unsupported risk previews, excessive purchase text and a hard-to-find mobile purchase button. New complete results use the four main reports. Existing paid/saved snapshots are not recalculated. `fixed-rules-v2` records the new routing rules in each new snapshot; comparisons with the earlier rules must account for that revision.

- Scope profile risk chapters to evidence tags: e.g. a current broken-promise chapter requires the selected current-partner empty-promises answer. Reliable current behavior is not replaced by a negative history or generic type-based claim. Positive interactions can remain in the relationship section.
- Suppress empty locked chapters. Name the actual deeper-pattern chapters, show one explicitly free paragraph from the matched deeper chapter, and describe the complete answer record. Do not fabricate testimonials. The remaining paid paragraphs stay server-only.
- Offer eligibility requires a named primary result, adequate core answers and at least two substantive chapters. Enforce this on checkout and in free preview. Legacy thin mixed reports stay readable but cannot create a new order.
- Purchase box is title, one-time USD price, button and short policy links. Delivery/access help is collapsed. Existing legal policy and provider checkout disclosures are unchanged. A link below the result header and a fixed mobile link jump to this box; only its purchase button opens checkout.
- First question compares trust, urgent reassurance, approach/hesitation and deliberate emotional distance at the same moment. Explicitly names the partner; removes `check in` and message-count progression. The scoped migration updates prompt, four labels, interpretations, previews and admin Chinese references, preserving option IDs/tags/scoring and other questions. Original release input remains archival.
- Starting a new quiz fetches no-store questions. The new client also strips only the known retired fifth core skip from a stale V2 response; backgrounds keep their options. Already-running old JavaScript needs a reload. The owner confirmed the front-end E disappeared after a hard refresh.

Validation: build, TypeScript, 108 tests including all 680 core count vectors and reversed question placement, negative/positive partner evidence, thin-report checkout guards, snapshot preservation and Q1 migration idempotency/concurrent-edit protection. Browser QA with actual API responses covers avoidant, secure/reliable-partner and close-score cases at 390px: accessible mobile offer, functional anchor/checkout callback, compact offer, actual excerpt, full 20-answer record, no JS errors or horizontal overflow. No real payment or email was created.

Release order: commit and push clean main; `npm run deploy`; apply `db/releases/2026-10-08-attachment-q1-parallel.sql`; verify the public 20-question flow and Q1 at apex and www. Final receipt is recorded in the parent repository handoff.


## Free result display refinement
The owner requested a larger attachment label, only three answer interpretations, removal of the early green purchase link and duplicate traits, no complete paragraph sample, and locked text that continues directly from the visible opening.

- Attachment labels are 32px on narrow screens and grow to 42px; long fearful-avoidant labels wrap without overflowing.
- The shared free overview projection selects three evidence items, removes the retired sample/traits and derives unfinished previews from the actual corresponding frozen risk, origin and deeper chapters. Old unpaid result reads receive the same projection without changing stored snapshots or requiring a new quiz. Admin previews and new submissions share this composition.
- Blur is decorative and follows the opening; the rest of the paid paragraph is absent from the public payload. No newly authored family history or risk inference is introduced. The managed legacy preview metadata remains stored; the current free display uses each chapter body as its source.
- Keep the single bottom purchase card and mobile sticky jump link. Paid access still contains all selected chapter bodies and the complete 20-answer record. Price, question bank, scoring, payment rights and provider checkout stay as previously released.
- No database migration or template reseed is required for this release.

Validation: build and TypeScript pass; all 109 tests pass, including legacy sample removal, three-example projection, preview-to-paid-body correspondence and immutable snapshots through the actual Worker API. Browser QA covers avoidant, secure, close-score and fearful results at 390px: three free examples, enlarged label, removed sections, no overflow or JS errors, working sticky anchor and checkout callback, and 20 full-answer entries. Screenshots remain in ignored `work/preview-refinement/`.


## Direct result introductions and removal of score panel
The owner rejected the avoidant metaphor translating as “carrying alone,” requested its removal and found the result unconvincing. Consumer summaries now show the large type name as the only heading, concrete reactions and possible relationship costs, followed by three answer examples. Remove the hero headline and green score comparison entirely; preserve the four-score metadata, close/tie rules and admin inspection.

- Rewrite the four default introductions using direct reactions instead of metaphors. Avoidant: lowering expectations after disappointment, handling things privately and finding it harder to feel supported. No personal family history is inferred from the type.
- Make risk section headings specific to the main type: effort to maintain contact, distance and loneliness, approaching and withdrawing, or patience becoming acceptance of too little. Origins and recurring reactions remain evidence-based chapter previews; complete text remains private.
- `fixedResultIntro` applies only exact former default-summary corrections, including old saved report displays, without rewriting snapshots or overriding custom managed text. This also avoids requiring a retake to remove the rejected default introduction.
- After deployment, apply `db/releases/2026-10-08-attachment-direct-intros.sql`: one guarded update of four default summaries and the template revision. Any managed summary edit makes the whole update a no-op. Existing paid chapters, questions, prices and report snapshots are untouched. The archived release corpus remains unchanged.

Validation: TypeScript/build and all 111 tests pass, including idempotent migration, concurrent managed-summary protection, unchanged paid fields/snapshots and exact-only legacy display corrections. Five 390px browser cases include the owner's avoidant 5 / secure 4 / fearful 3 / anxious 2 proportions. Verified one type heading, no metaphor headline or score block, three free examples, functional mobile purchase jump/callback, all 20 paid answers, and no overflow or JS exceptions. Visual screenshots reviewed in ignored `work/result-copy/`.

Admin follow-through: remove the retired hero-headline input and unused teaser editor, explain that visible previews come from the paid body, and retain all four scores/tie details in an admin-only expandable inspection panel. No managed legacy metadata is deleted.
