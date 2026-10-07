# Quiz email editing and in-flight edition completion — 2026-10-07

## Goal
Allow another quiz attempt to use an edited email and complete an already-loaded previous attachment edition after the launch catalog switch.

## Findings
- Live apex and www question APIs and server-rendered landing/detail pages currently include all 20 launch IDs. API responses use no-store; pages use no-store, must-revalidate.
- The client previously started from its embedded/cached questions indefinitely, while submission validated only against currently active rows. Retiring the previous bank therefore stranded complete in-flight attempts.
- Recent aggregate events still included previous-edition question IDs. This supports in-flight compatibility being needed; it does not identify the exact user's tab or prove which browser cache mechanism loaded it.
- A stored profile email replaced the input with read-only text, and submission preferred profile.email over edited state.

## Decisions and files
- app/quiz-app.tsx: starting a new attempt fetches the live catalog with no-store. No stale fallback on that path. Already-started attempts retain their questions. The email input stays editable and prefilled; save uses its current value. Late profile loading cannot overwrite a user's edit.
- app/api/submit/route.ts: keep current catalog validation first. Only the exact retained previous 20 attachment IDs can use the compatibility path, and only while the launch edition is active. Resolve text/options from D1, not defaults. Mixed, incomplete, invalid, deleted and arbitrary inactive question sets remain rejected. Public catalog availability is unchanged.
- Existing same-session saves stay idempotent and ownership checked. A different email on an already-saved session receives an explicit conflict instead of silently ignoring the requested change. A new session on the same profile can use a new email. Earlier reports and their delivery addresses remain unchanged.
- tests/quiz-submission.integration.test.mjs: real built Worker/local D1 exercises those paths without external email/payment calls.

## Validation
- npm test: build and all 90 tests passed, including payment/refund/ownership/catalog/funnel regressions.
- npx tsc --noEmit passed.
- Isolated browser preview: returning profile, all 20 questions, prefilled editable email changed to a synthetic address, successful save and rendered 20-answer report. Captured request email and subsequent profile response match the edited address; start issued a fresh question API request. Debug export stays ignored in work/. Preview-only favicon connection errors were present; form submission succeeded.
- No production quiz submission or email delivery was generated for QA.

## Deployment and remaining limits
Commit and push main, verify clean HEAD equals origin/main, then npm run deploy. No D1 migration is required.
A tab already running the old frontend can retry its completed previous bank against the fixed API without refreshing. It still has the old read-only email UI: changing that UI requires a new page load. Unsaved answers are in memory only, so do not tell a user to refresh an answered tab to preserve their answers. Newly opened quizzes receive the editable input and current-bank start check.
No factory scheduling or publishing changes. Future catalog editions need an explicit retained-edition compatibility decision; this change does not accept arbitrary retired questions.
