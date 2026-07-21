import type { Metadata } from "next";
import { LegalPage, PolicySection } from "@/app/_components/legal-page";

export const metadata: Metadata = {
  title: "Self-Reflection Disclaimer — DeepPersona AI",
  description: "Important limits of DeepPersona AI visual psychology tests and automated interpretations.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage eyebrow="Important context" intro="DeepPersona AI can offer prompts for reflection, but it cannot know your full history, circumstances, or mental-health needs." title="Self-Reflection Disclaimer">
      <PolicySection title="Not a clinical assessment"><p>Our visual tests are not validated diagnostic instruments and are not designed to diagnose, prevent, monitor, treat, or cure any mental-health or medical condition. Words such as “pattern,” “type,” “attachment,” “need,” or “projection” describe reflective themes, not clinical findings.</p></PolicySection>
      <PolicySection title="Automated and interpretive content"><p>Results are generated from a small number of image choices using predefined scoring and written interpretations. Different contexts, cultures, moods, and relationships can change how a person responds. A result may feel useful, partly useful, or inaccurate.</p></PolicySection>
      <PolicySection title="Use your own judgment"><p>Do not use a result as the sole basis for decisions about health, treatment, safety, employment, education, finance, legal matters, or relationships. Seek an appropriately qualified professional when a decision requires professional assessment.</p></PolicySection>
      <PolicySection title="Crisis support"><p>DeepPersona AI is not a crisis service and does not monitor submissions for emergencies. If you or another person may be in immediate danger, contact local emergency services. If you are experiencing a mental-health crisis, contact a qualified local crisis line or healthcare provider.</p></PolicySection>
      <PolicySection title="No guaranteed outcome"><p>We do not guarantee that a test, report, prompt, or recommendation will produce a particular personal, emotional, relationship, or commercial outcome.</p></PolicySection>
    </LegalPage>
  );
}
