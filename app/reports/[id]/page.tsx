import type { Metadata } from "next";
import { QuizApp } from "@/app/quiz-app";
import { AstroReport } from "@/app/_components/astro-report";
import { ensurePaymentSchema } from "@/db/payment-store";
import { getD1 } from "@/db/quiz-store";
import { ASTRO_TEST_ID } from "@/lib/astro";
import { defaultTests } from "@/lib/quiz-content";
import { publicTest } from "@/lib/public-quiz";

export const metadata: Metadata = { title: "Your saved reading — DeepPersona AI", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensurePaymentSchema();
  const row = await getD1().prepare("SELECT test_id FROM quiz_reports WHERE id = ?").bind(id).first<{ test_id: string }>();
  // Astro readings use the new report view; older psychology reports keep their original view.
  if (row?.test_id === ASTRO_TEST_ID) return <AstroReport reportId={id} />;
  return <QuizApp initialReportId={id} initialTests={defaultTests.map(publicTest)} initialQuestions={[]} />;
}
