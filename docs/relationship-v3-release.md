# Relationship image quiz, edition 3

Approved for production after owner review of 20 scenarios and 80 newly generated images.

- Public question IDs use `attachment-style-v3-q01` through `q20`. Existing catalog reconciliation inserts the new edition and retires the previous bank. Saved report snapshots remain unchanged.
- Twenty WebP atlases in `public/quiz/relationship-v3` contain A/B/C/D in top-left, top-right, bottom-left, bottom-right order. Images were generated individually using the built-in image generation tool, visually reviewed, and assembled for the existing atlas renderer.
- Question wording and 80 distinct interpretations live in `lib/relationship-content.ts`. Editorial themes follow option metadata, not option position. There are no clinical anxiety/avoidance scores in new reports.
- Full reports include five contextual modules and the selected image interpretations. Paid copy stays server-side; the client imports identifiers from `lib/public-catalog.ts` only.
- Existing backend prices, Stripe configuration, fulfillment, and email recovery remain in effect.

Validation: 31 tests covering catalog, position-independent reading, historical snapshots, checkout authorization, pricing, fulfillment, refunds and email delivery. Isolated browser run completed 20 questions and opened the saved full report. First-question images loaded at a 390px viewport without horizontal overflow.
