import type { Metadata } from "next";
import { QuizApp } from "@/app/quiz-app";
import { defaultTests } from "@/lib/quiz-content";
import { publicTest } from "@/lib/public-quiz";

export const metadata: Metadata = { title: "Your saved report — DeepPersona AI", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  return <QuizApp initialReportId={(await params).id} initialTests={defaultTests.map(publicTest)} initialQuestions={[]} />;
}
