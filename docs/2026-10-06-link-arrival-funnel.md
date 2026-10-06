# Link arrival and click-cohort attribution
The owner requested the complete profile-to-link-to-arrival funnel in Factory.
- Branded GET redirects create one anonymous random click token in traffic_link_clicks. Schema initializes through the site worker; traffic_link_state records activation time. HEAD does not create a record.
- The visible page confirms arrival with an origin-checked, bounded, idempotent POST. No browser storage, IP or fingerprint is added. Existing analytics opt-outs suppress confirmation and token propagation.
- Existing quiz_attribution.visit_id records the token at session start. Factory reads cohort aggregates directly; payment fulfillment, reports and content are unchanged.
- Missing storage must not block navigation. Client confirmation retries once and can retry on later page loads; copied destination URLs retain the same token, so counts are per tracked link request rather than unique humans.
- Validation: TypeScript and production build succeeded; 82 tests passed. Production verification is recorded in the Factory handoff.
