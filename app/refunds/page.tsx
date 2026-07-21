import type { Metadata } from "next";
import { LegalPage, PolicySection, SUPPORT_EMAIL } from "@/app/_components/legal-page";

export const metadata: Metadata = {
  title: "Refund & Delivery Policy — DeepPersona AI",
  description: "Refund eligibility, digital delivery, cancellation, and payment processing information.",
};

export default function RefundsPage() {
  return (
    <LegalPage eyebrow="Clear digital-product fulfillment" intro="This policy explains how future paid DeepPersona AI reports will be delivered, how to request a refund, and how cancellations will work." title="Refund & Delivery Policy">
      <PolicySection title="1. Current payment status"><p>Paid checkout is not yet active. No charge will be made until a live payment provider, visible price, currency, product description, and active checkout button are shown on the website.</p></PolicySection>
      <PolicySection title="2. Digital delivery"><p>Paid reports are digital products. Unless stated otherwise at checkout, access will be provided on-screen and/or by email promptly after the payment provider confirms a successful charge. There are no physical goods, shipping fees, or return shipments.</p></PolicySection>
      <PolicySection title="3. Fourteen-day refund requests"><p>You may request a refund within 14 calendar days after purchase by emailing <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Include the purchase email, order or receipt number, purchase date, and a short description of the issue. We aim to respond within three business days.</p></PolicySection>
      <PolicySection title="4. Eligible situations"><ul><li>The report was not delivered or cannot be accessed after reasonable troubleshooting.</li><li>The product materially differs from the description shown before purchase.</li><li>You were charged more than once for the same order.</li><li>The purchase was unauthorized, subject to reasonable verification.</li><li>You request a refund within the stated 14-day period, unless fraud or clear abuse is involved.</li><li>Applicable law requires another remedy or a longer period.</li></ul></PolicySection>
      <PolicySection title="5. How refunds are issued"><p>Approved refunds are sent to the original payment method through the payment provider. We do not control bank processing time; funds commonly take 5–10 business days to appear after a refund is issued. Taxes and currency conversion are handled according to the payment provider’s process and applicable law.</p></PolicySection>
      <PolicySection title="6. Duplicate and unauthorized charges"><p>Please contact us promptly so we can investigate before a chargeback is filed. Reporting an unauthorized payment does not limit rights available through your bank or applicable law.</p></PolicySection>
      <PolicySection title="7. Subscriptions and cancellation"><p>DeepPersona AI does not currently sell subscriptions. If a subscription is introduced, the billing interval, renewal terms, trial terms, and cancellation method will be shown before purchase. Customers will be able to cancel future renewal without losing access already paid for through the current billing period. Any refund or prorating will follow the checkout disclosure and applicable law.</p></PolicySection>
      <PolicySection title="8. Changes"><p>We may update this policy before paid products launch or when products change. The version presented at checkout and any mandatory consumer rights applicable at the time of purchase will govern that transaction.</p></PolicySection>
    </LegalPage>
  );
}
