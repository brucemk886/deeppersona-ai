# Random compact homepage links

## Goal and decisions
Support Factory's shorter random five-character homepage aliases directly at / plus the code. First character 1-9 avoids application route names; remaining characters are lowercase letters/digits. Keep old /go/10hex URLs valid.

Factory still owns all mappings and uniqueness. The trusted service response sends X-Factory-Link-Code; registerLinkClick stores that original code for both forms so historical and new visits share the same funnel. Require a valid canonical code for compact redirects. Forward only safe headers, no cookies, credentials or query data. HEAD never records visits. No changes to quiz content, reports, purchases or site content.

## Files
worker/short-links.ts; tests/short-links.test.mjs.

## Validation
Focused redirect/privacy/GET/HEAD/canonical-click tests passed. Production build, TypeScript checking and all 112 tests passed.

## Rollout
Deploy this site compatibility first, then Factory migration 0088 and compact link output. Verify old and new URLs with HEAD only. Users recopy the new address in Factory; existing profile URLs keep working.

## Release evidence
Commit a63de5bbacb92166502e45626f9d9630b974e064 deployed via npm run deploy and synchronized to GitHub main. Worker 4161baa0-ba79-443c-a08d-f4ff50403c43. After Factory migration 0088 and Worker 1fc5de8c-b6aa-4aef-ab88-981f3198b22b, legacy and random compact HEAD requests returned identical no-store 302 destinations without creating clicks. All 21 existing Factory links have unique aliases. No unfinished work; users can copy the new addresses from Factory.
