# Mobile loading optimization — 2026-09-10

Audience: primarily TikTok mobile visitors. Preserve selected homepage design and analytics behavior.

## Confirmed changes
- Removed the operations-dashboard stylesheet from the public render-blocking bundle. vinext combines route CSS imports, so admin/layout.tsx includes a route-local /styles/admin.css link instead. Login and dashboard share this layout. Corrected the existing missing admin-green fallback on the login button during verification.
- Public CSS: 120,826 -> 86,609 bytes, 28.3% smaller before HTTP compression. Local gzip comparison: 24,230 -> 17,757 bytes; live Cloudflare transport uses Brotli, so these gzip numbers are not claimed as measured transfer bytes.
- Reuse sanitized questions included in the server response before doing another /api/questions request. Direct start no longer waits on the duplicate request's 4-second timeout. Missing server-supplied questions still follow the existing fetch/error path.
- Defer /api/profile until the visitor starts interacting beyond the landing/detail page, once per mounted flow. Do not overwrite an email the visitor already typed.
- Disable automatic Link prefetch for homepage/navigation/support links. Homepage request audit showed /.rsc, /insights.rsc and /blog.rsc before this change and none afterward during the homepage stage.
- Hash-versioned /assets/* now use one-year immutable caching. Editorial images use one-day caching; quiz image policy remains one hour. Dynamic HTML, reports, API responses and payment state are not assigned shared caches.

## Evidence
- Before-production HTML and CSS saved privately in work/mobile-perf/.
- Local request-audit proxy: work/mobile-perf/proxy.mjs; final mixed-flow requests.jsonl. Homepage phase has no profile/questions requests and no route prefetch. Clicking Start opens question 1 of 12 with zero question API calls; profile is fetched once only after start. Later /admin/login can independently prefetch its Home link.
- Mobile browser at 390 x 844: image loaded, homepage unchanged, main CTA opens quiz. Console errors checked: none.
- Admin login browser inspection: separate stylesheet linked, form and green submit button visible. No production admin login or payment was attempted.
- TypeScript passed. Existing regression suite: 30 passed.

## Measurement limits
Chrome DevTools MCP is unavailable, so no Lighthouse score, throttled LCP/INP, real TikTok WebView timing or concurrency capacity is claimed. The baseline single-request HTML elapsed time is not a performance guarantee. These changes reduce measured asset size and verified requests; real US mobile performance still needs device/field measurements.
