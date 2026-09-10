# Homepage design QA

Source visual truth: C:/Users/111/.codex/generated_images/01a07f02-b349-7db2-b696-172dd7244421/exec-f1eb7be9-2bf2-4a28-9d95-fca745af0b7b.png (selected option 1).
Implementation: http://127.0.0.1:8787/; screenshot work/design/mobile-final.png; desktop work/design/desktop-final.png.
Viewport: 390 x 844 CSS pixels (mobile), 1440 x 1024 (desktop). Source pixels: 853 x 1844. Browser screenshot output is scaled to 375 x 812; both views normalized to 390 x 844 for comparison. No device chrome in source or capture. Native browser scrollbar remains in capture.
State: home, catalog loaded, no user submission. Local database price USD 4.99; production price is separately configured and not changed.
Full-view comparison: work/design/comparison-v1.png and work/design/comparison-final.png combine source and implementation in the same image.
Focused comparison: title, CTA, photo and sample heading are all readable in the combined 780 x 844 image; a further crop was unnecessary.

## Findings and comparison history
- Initial P2: inherited CTA margin and heading spacing added roughly 60px before the image; report preview was pushed down. Fixed mobile heading line height, kicker display and button margin. Final combined capture shows the intended title / CTA / photo / price / report hierarchy.
- Initial P2: report sample was collapsed and followed explanatory copy on mobile. Opened the actual excerpt by default and moved it first visually on mobile. Final capture shows the sample entry at the bottom of the initial viewport; expansion/collapse is available.
- No remaining actionable P0/P1/P2 findings in the homepage scope.

## Required fidelity surfaces
- Typography: retained Georgia editorial headings and existing system sans-serif body; two-line mobile title, 18px lede, 16px CTA. Native rendering differs slightly from raster mock typography (P3).
- Spacing: full-width mobile image, inset 24px text, prominent CTA, lightweight dividers. Desktop uses a two-column adaptation of the selected mobile direction.
- Colors: existing cream/paper and forest green tokens retained; removed decorative homepage gradient.
- Images: real generated raster asset matching the source sofa conversation, natural window light and cream/olive palette. 640w WebP 40,090 bytes; 1200w 96,802 bytes. Explicit dimensions, responsive srcset and high fetch priority; browser confirmed 640w loaded on mobile.
- Content: selected headline implemented; question count and approximate duration use loaded catalog; price uses backend data without a stale fallback. Sample is a real excerpt from the current report template, explicitly labeled, replacing the mock's decorative paper graphic. This is intentional: no invented downloadable report or testimonial. Existing educational content continues below the chosen first-screen design.

## Verification
- Mobile navigation expands and My reports reaches /recover without submitting or sending email.
- Main CTA opens attachment quiz question 1; selecting an image advances to question 2 of 12.
- Browser console error check returned no errors during these interactions.
- Desktop homepage inspected at 1440 x 1024; no clipped primary controls.
- TypeScript passed; existing test suite 30/30 passed. Updated one assertion referencing the deliberately replaced headline.
- No live payment, full checkout, email delivery or load test was performed in this visual change.

## Follow-up polish
- P3: exact raster font shapes and photo posing differ slightly from the generated mock.
- Question-image bank and full blog redesign are outside this selected homepage implementation.

final result: passed
