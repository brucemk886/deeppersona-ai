import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, PolicySection, SUPPORT_EMAIL } from "@/app/_components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — DeepPersona AI",
  description: "Terms governing use of DeepPersona AI visual tests and digital reports.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Rules for using the service" intro="These terms govern your access to DeepPersona AI, its visual tests, interpretations, emails, and future paid digital reports." title="Terms of Service">
      <PolicySection title="1. Agreement"><p>By accessing or using DeepPersona AI, you agree to these Terms and acknowledge our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the service. You must be at least 16 years old or the minimum age required in your location to consent to online services.</p></PolicySection>
      <PolicySection title="2. What the service provides"><p>DeepPersona AI offers image-based prompts, automated scoring, and written self-reflection content. Results are generated from your selections and are designed for entertainment, education, and personal reflection.</p></PolicySection>
      <PolicySection title="3. Not healthcare or professional advice"><p>DeepPersona AI is not a medical, psychological, psychiatric, diagnostic, crisis, legal, financial, or other professional service. Results do not establish a diagnosis and should not replace advice from a qualified professional. If you are in danger or experiencing a crisis, contact local emergency or crisis services.</p></PolicySection>
      <PolicySection title="4. Accounts, email, and marketing"><p>You must provide accurate information when submitting an email or making a purchase. Receiving your test result is not conditional on marketing consent. If you separately opt in, we may send relevant reflections, new tests, or offers; you may unsubscribe at any time.</p></PolicySection>
      <PolicySection title="5. Paid digital products"><p>When paid reports become available, the product description, included content, one-time or recurring nature, price, currency, taxes, and delivery timing will be shown before payment. Payment may be processed by Stripe, Creem, or another disclosed provider. Your purchase is also subject to the provider’s payment terms. Digital reports are delivered electronically after confirmed payment unless the checkout states otherwise.</p></PolicySection>
      <PolicySection title="6. Refunds, delivery, and cancellation"><p>Our <Link href="/refunds">Refund & Delivery Policy</Link> forms part of these Terms. It explains the current 14-day refund request window, digital delivery, duplicate or unauthorized charges, processing times, and future subscription cancellation.</p></PolicySection>
      <PolicySection title="7. Acceptable use"><p>You may not interfere with the service, attempt unauthorized access, scrape or reproduce substantial parts of the content, submit malicious code, misuse another person’s information, evade payment, exploit the service for unlawful discrimination, or present results as clinical diagnoses or professional assessments.</p></PolicySection>
      <PolicySection title="8. Intellectual property"><p>The DeepPersona AI brand, interface, test structure, original copy, interpretations, and related materials are owned by or licensed to the operator and are protected by applicable intellectual-property laws. We grant you a limited, revocable, non-transferable license to use the service and your purchased report for personal, non-commercial purposes.</p></PolicySection>
      <PolicySection title="9. Availability and changes"><p>We may improve, change, suspend, or discontinue features and may correct content or pricing errors. We do not promise uninterrupted availability. If a paid product cannot be delivered, the applicable remedy may include redelivery or a refund.</p></PolicySection>
      <PolicySection title="10. Disclaimers"><p>The service and content are provided on an “as available” basis to the extent permitted by law. Automated interpretations are inherently general and may not accurately reflect your identity, history, or circumstances. You remain responsible for decisions you make based on the content.</p></PolicySection>
      <PolicySection title="11. Limitation of liability"><p>To the maximum extent permitted by applicable law, DeepPersona AI will not be liable for indirect, incidental, special, consequential, or punitive losses arising from use of the service. For claims connected to a paid product, our aggregate liability will not exceed the amount you paid for that product during the 12 months before the claim. Nothing in these Terms excludes rights or liability that cannot legally be excluded.</p></PolicySection>
      <PolicySection title="12. Governing rules and disputes"><p>These Terms are governed by applicable consumer and commercial law. Mandatory consumer protections in your country remain unaffected. Before filing a formal claim, please contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> so we can try to resolve the issue directly. The operator’s registered jurisdiction and any mandatory venue will also be disclosed in checkout business details before paid sales begin.</p></PolicySection>
      <PolicySection title="13. Contact"><p>Questions about these Terms may be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p></PolicySection>
    </LegalPage>
  );
}
