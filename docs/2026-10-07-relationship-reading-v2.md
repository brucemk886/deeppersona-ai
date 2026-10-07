# Relationship reading and offer revision — 2026-10-07

## Goal
Address the user's screenshot feedback that the unlock page and interpretation provide too little reason to pay. Keep the question bank stable while improving the actual reading and the explanation of what a purchase adds.

## Evidence and bounded UX review
The user supplied the current translated offer screenshot. Additional captures use the built site and isolated local D1 fixtures, not production customer reports.
1. Free result: old page led with a type label and count cards, then repeated selections. Revised page leads with a response-specific headline, two saved answers, an actual scenario reading, and an exception. Counts remain available in a disclosure. Desktop and 390px mobile reflow verified.
2. Unlock offer: old generic script sample did not explain why this particular person's next chapter mattered. Revised forest-color offer lists three chapters corresponding to their selected scenarios, explains the reading's added value, and keeps one-time price and existing purchase/refund terms. The CTA links to the existing purchase section. No discount, testimonial, urgency, diagnostic score or claimed conversion uplift was invented.
3. Full report: old repeated response summaries were replaced with 20 situations x 4 editorial interpretations, a response-specific need/protection/cost reading, concrete existing scripts, actual follow-through decision guidance, and contextual domain sections. Stable/secure selections are not forced into an anxious narrative; close/tied results remain contextual. Mobile reading layout inspected.

Accepted screenshots and local review: work/report-reading-review.html. Before: report-before-free.png and report-before-paid.png. After: report-after-free-desktop.png, report-after-mixed-mobile.png, report-after-paid-detail-mobile.png, report-after-secure-mobile.png. These are synthetic QA artifacts and remain ignored. Two later wording refinements soften the anxious headline and accurately describe broad four-way mixed results; the surrounding layout is unchanged.

Accessibility limits: native disclosures, semantic headings, named navigation, visible focus rules and mobile reflow are present. This was not a screen-reader audit or a claim of full WCAG compliance. The local fixture disables real checkout, so browser QA did not make a live purchase. Existing payment integration tests cover checkout authorization, delivery, pricing and refunds.

## Implementation decisions
- lib/attachment-launch-story.ts is server-only and marks the additive reading as attachment-reading-v2. It uses frozen saved answers, not current D1 questions. Specific scene interpretation requires matching the saved prompt, answer label and response key to the known scenario; arbitrary admin rewrites retain generic interpretation rather than receiving unrelated specifics.
- New reports save the reading version. Existing launch reports gain the additive reading in memory on owned report GET; the stored historical snapshot, original answers, scripts, prices, ownership and purchase rights are not rewritten. Legacy pre-launch reports retain their own flow.
- Unpaid API responses expose only the overview excerpt, evidence and chapter questions. Detailed reading, decision guidance and paid scripts remain behind the existing server entitlement check and are absent from client bundles. Refund still removes full access.
- lib/attachment-launch.ts adds optional typed fields so old snapshots remain compatible. lib/attachment-launch-report.ts adds the reading when saving new reports.
- app/_components/attachment-launch-result.tsx, free-attachment-results.tsx and scoped globals.css rules implement the hierarchy using the existing brand colors and typography. No question migration, factory scheduling, account pool or pricing changes.

## Validation
- npx tsc --noEmit passed.
- Final npm test: build and all 95 tests passed. An initial parallel run had one local undici connection termination in catalog integration; its isolated retry and the final full run passed.
- Added tests cover all 80 scenario/response combinations, varied chapter questions, canonical evidence, mixed results, changed managed prompts/options, additive snapshot immutability, unpaid projection and client bundle separation. Extended lifecycle tests verify old launch snapshots get the reading without DB writes and refunded responses still exclude paid sections.
- Browser captures verify desktop free result, mobile mixed/stable responses, full reading and the offer interaction. No real payment or email sent. Preview-only connection errors are retained in the ignored debugging export.

## Release and next step
Commit and push main, require a clean checkout and exact HEAD == origin/main, then npm run deploy. No D1 migration is needed. Refresh an already-saved launch result to see the new reading; users do not need to retake the quiz for this upgrade.
Assess the existing result-view, checkout-click, paid and paid-opened funnel after release. This is an editorial/product revision, not an A/B test or evidence that conversion has improved. Keep the 20 questions fixed until actual drop-off data supports another change.
