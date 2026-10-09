# Random compact homepage links

## Goal and decisions
Support Factory's shorter random five-character homepage aliases directly at / plus the code. First character 1-9 avoids application route names; remaining characters are lowercase letters/digits. Keep old /go/10hex URLs valid.

Factory still owns all mappings and uniqueness. The trusted service response sends X-Factory-Link-Code; registerLinkClick stores that original code for both forms so historical and new visits share the same funnel. Require a valid canonical code for compact redirects. Forward only safe headers, no cookies, credentials or query data. HEAD never records visits. No changes to tests, reports, purchases or site content.

## Files
worker/short-links.ts; tests/short-links.test.mjs.

## Validation
Focused redirect/privacy/GET/HEAD/canonical-click tests passed. Production build and the complete npm test suite passed. Deployment verification pending.

## Rollout
Deploy this site compatibility first, then Factory migration 0088 and compact link output. Verify old and new URLs with HEAD only. Users recopy the new address in Factory; existing profile URLs keep working.
