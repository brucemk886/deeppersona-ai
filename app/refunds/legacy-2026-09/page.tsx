import type { Metadata } from "next";
import { LegalPage, PolicySection, SUPPORT_EMAIL } from "@/app/_components/legal-page";

export const metadata: Metadata = {
  title: "Refund & Delivery Policy — DeepPersona AI",
  description: "Refund eligibility, digital delivery, cancellation, and payment processing information.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/refunds/legacy-2026-09" },
};

export default function RefundsPage() {
  return (
    <LegalPage eyebrow="Clear digital-product fulfillment" intro="This archived policy continues to apply to orders created under the original 14-day refund terms. It does not apply to new orders displaying the limited-refund policy." title="Previous Refund & Delivery Policy">
      <PolicySection title="1. One-time digital purchases"><p>DeepPersona AI, operated by NEXUS FRONTIER LLC, sells digital self-reflection reports through Stripe. Each purchase unlocks the full report for the selected test result only, not all tests or future results. Prices are shown in USD before payment. There are no subscriptions or recurring charges.</p></PolicySection>
      <PolicySection title="2. Digital delivery"><p>Paid reports are digital products. The full report opens on your saved report page after successful payment confirmation. If confirmation is still pending, use “Check payment status” on that page. We also email a private report link to the address you provided with your test. This link works across browsers and is valid for 180 days; you may request a new link at /recover while your purchase remains available. Link expiry does not itself cancel your purchase. Keep the link private, because anyone holding it can access that report. Without the email link, direct report-page access requires the original browser and its site data. If you cannot access a purchase, contact support with your purchase email and receipt or order reference so we can investigate. Reports are viewed on the website; the email contains an access link, not a PDF attachment. If an email does not arrive, check your spam folder and request a resend. Email delays do not prevent immediate on-screen access after payment confirmation. There are no physical goods, shipping fees, or return shipments.</p></PolicySection>
      <PolicySection title="3. Fourteen-day refund requests"><p>You may request a refund within 14 calendar days after purchase by emailing <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Include the purchase email, order or receipt number, purchase date, and a short description of the issue. We aim to respond within three business days.</p></PolicySection>
      <PolicySection title="4. Eligible situations"><ul><li>The report was not delivered or cannot be accessed after reasonable troubleshooting.</li><li>The product materially differs from the description shown before purchase.</li><li>You were charged more than once for the same order.</li><li>The purchase was unauthorized, subject to reasonable verification.</li><li>You request a refund within the stated 14-day period, unless fraud or clear abuse is involved.</li><li>Applicable law requires another remedy or a longer period.</li></ul></PolicySection>
      <PolicySection title="5. How refunds are issued"><p>Approved refunds are sent to the original payment method through the payment provider. We do not control bank processing time; funds commonly take 5–10 business days to appear after a refund is issued. Taxes and currency conversion are handled according to the payment provider’s process and applicable law. Full report access ends after a full refund.</p></PolicySection>
      <PolicySection title="6. Duplicate and unauthorized charges"><p>Please contact us promptly so we can investigate before a chargeback is filed. Reporting an unauthorized payment does not limit rights available through your bank or applicable law.</p></PolicySection>
      <PolicySection title="7. Subscriptions and cancellation"><p>Purchases are one-time payments with no automatic renewal. You can leave an unfinished checkout without completing a purchase. After a successful payment, use the refund process above to request a refund.</p></PolicySection>
      <PolicySection title="8. Changes"><p>We may update this policy when products or processes change. The version presented at checkout and any mandatory consumer rights applicable at the time of purchase will govern that transaction.</p></PolicySection>
    </LegalPage>
  );
}
