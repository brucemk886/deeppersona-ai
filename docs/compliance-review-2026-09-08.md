# US-focused website compliance review — September 8, 2026

This is an implementation review, not legal certification or assurance of Stripe approval.

## Fixed in this review

- Optional Google Analytics previously defaulted to granted, contrary to the policy's consent wording. Explicit opt-in is now required; legacy automatic grants do not count. Existing opt-outs and Global Privacy Control are respected. Blocked browser storage keeps analytics off.
- Application-generated GA events omit query strings, report/test identifiers, campaign values, referral URLs, answers and results. Report, recovery and admin pages do not initialize GA. First-party operational/session records remain separately disclosed.
- The owner confirmed an 18+ audience and no diagnostic, treatment or scientific-accuracy advertising claims. Start-test age confirmation and submission/event API checks implement that audience choice. This is self-declaration, not identity verification.
- Landing and pre-purchase descriptions explain predefined scoring/written interpretations, entertainment and self-reflection, and the lack of clinical validation. The 14-day refund link is adjacent to purchase information.

## Confirmed existing features

Public Terms, Privacy, Refunds/Delivery, Disclaimer and Contact pages; NEXUS FRONTIER LLC operating identity; USD, one-time purchase and scope of report; payment-confirmed unlock; email access/recovery; 14-day refund requests; no bundled marketing consent. Stripe account acct_1UDEzZDTdSC0RNde has the correct website and reports charges/payouts enabled. Those flags do not constitute regulatory or risk-review approval.

## Outstanding operating/legal checks

1. Sales-tax registration and advice: owner reports neither. Checkout does not currently calculate sales tax. A tax adviser should determine actual physical/economic nexus, digital-report tax classification and registration/filing obligations, considering BOTH businesses operated by the same LLC. Do not assume two Stripe accounts create separate taxpayers or independent thresholds. Do not turn on tax collection without assessing registration obligations.
2. State consumer-health-data laws: the service processes emotional/relationship answers and inferred themes linked to email. Applicability (including Washington My Health My Data and other relevant state rules) needs specialist review; an entertainment disclaimer alone does not settle classification. If applicable, evaluate the separate health-data privacy notice, collection/sharing consent or requested-service exceptions, vendor contracts and deletion obligations. Do not claim HIPAA certification or assume small size exempts the business.
3. Stripe support_email and support_url are missing. Updating through the existing API key returned StripePermissionError; complete in the current account's Dashboard public business details. Intended values: bruce@deeppersonaai.com and https://deeppersonaai.com/contact.
4. Follow the published refund response target and process real privacy access/deletion requests. Verify ownership before disclosure. Establish and implement retention schedules; don't promise that every record has been automatically deleted without evidence.
5. Marketing is not enabled by the transactional report mail integration. Before marketing, implement consent records, unsubscribe/suppression, a valid postal address, and CAN-SPAM compliant subject/sender practices. Keep report-delivery messages focused on delivery.
6. Actual TikTok ads and media licences were not independently reviewed. Owner reports no diagnostic/treatment/accuracy claims. Apply the same 18+ and non-clinical positioning to future ads.

## Sources

- https://docs.stripe.com/get-started/checklist/website
- https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance
- https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy
- https://docs.stripe.com/tax/supported-countries/united-states
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

Validation: TypeScript and 15 automated tests, including consent migration, sensitive-identifier omission, blocked private-page analytics, age acknowledgement, payment authorization and email delivery.
