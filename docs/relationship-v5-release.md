# Relationship image quiz, edition 5

Approved to ship with results thickening (2026-09-11).

- Same public IDs (`attachment-style-v3-q01` through `q20`) and atlas paths. Catalog reconciliation updates wording, interpretations, and images in place. Saved report snapshots remain unchanged.
- Order: Romance Q1–12, Self-esteem Q13–16, Childhood Q17–20.
- Scoring: A anxious +2, B avoidant +2, C secure 0, D fearful +1/+1. Primary four-style label comes from those scores. Card microcopy equals the option labels.
- Twenty WebP atlases in `public/quiz/relationship-v3` still crop A/B/C/D as top-left, top-right, bottom-left, bottom-right. Option tiles use bright everyday US lighting (daylight or warm well-lit interiors), not cinematic night. Photoreal, US-diverse scenes replace the previous dark tiles via the existing generate-then-assemble pipeline. Quiz prompts, labels, and A/B/C/D scoring are unchanged.

## Bright atlas refresh and D1 `atlas_path`

Catalog `atlasPath` values stay `/quiz/relationship-v3/q01.webp` … `q20.webp`. Replacing those files is enough for a clean checkout.

Live D1 may still serve a stale `quiz_questions.atlas_path` if a row was edited away from the catalog path, or if catalog reconcile has not run since an older bank. After `npm run deploy`:

1. Confirm production is on the commit that contains the new WebPs.
2. Hit a path that calls `listTests()` (home, test detail, or admin tests). That runs `reconcilePublicCatalog()`, which upserts `atlas_path` and `cover_atlas_path` from `lib/relationship-content.ts` / `lib/quiz-content.ts`.
3. If a row still points elsewhere, delete the attachment questions in D1 (or upsert `atlas_path` to the catalog files) and reload so reconcile can rewrite them. Saved report snapshots keep their original image paths.
4. Hard-refresh the quiz. Same URL + CDN cache can keep showing the old dark files until the new assets propagate.
- Free results (after the unchanged email gate): AP-style hero (Anxious-Preoccupied / Dismissing-Avoidant / Secure / Fearful-Avoidant) + banner, How you scored 0–7 bars with Low/Medium/High/Very High, romantic essay, caregiver scores from Q17–20, self-worth ring from Q13–16, blur/lock premium teases, one romance sample, $9.99 paywall with three bullets. No share card. No Mother/Father/Work multi-dot scores.
- Paid unlock ($9.99 one-time): expands blurred sections, all 20 image interpretations, pairing notes, 7-day practices, page unlock plus email backup link.
