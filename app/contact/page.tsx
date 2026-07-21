import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, PolicySection, SUPPORT_EMAIL } from "@/app/_components/legal-page";

export const metadata: Metadata = {
  title: "Contact & Support — DeepPersona AI",
  description: "Contact DeepPersona AI for product, privacy, billing, and refund support.",
};

export default function ContactPage() {
  return (
    <LegalPage eyebrow="Human support" intro="Questions about a result, your data, or a future purchase can be sent directly to our support inbox." title="Contact DeepPersona AI">
      <section className="contact-card"><span>Support email</span><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a><p>We aim to reply within three business days. Please do not send passwords, full card numbers, or other unnecessary sensitive information.</p></section>
      <PolicySection title="Product and technical support"><p>Include the test name, what you expected to happen, what happened instead, and the device or browser you used. Screenshots are helpful when they do not expose sensitive information.</p></PolicySection>
      <PolicySection title="Billing and refunds"><p>Include the purchase email, receipt or order number, purchase date, and issue. Review the <Link href="/refunds">Refund & Delivery Policy</Link> for eligibility and processing times.</p></PolicySection>
      <PolicySection title="Privacy requests"><p>For access, correction, deletion, or marketing opt-out requests, write from the email connected to the record and state the request clearly. See the <Link href="/privacy">Privacy Policy</Link> for details.</p></PolicySection>
      <PolicySection title="Business identity"><p>DeepPersona AI is the public-facing product brand. The operator’s verified legal name, registered jurisdiction, and any required business address will be displayed in checkout and receipts before live paid sales begin.</p></PolicySection>
    </LegalPage>
  );
}
