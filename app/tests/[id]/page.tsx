import { QuizApp } from "@/app/quiz-app";
import { defaultTests } from "@/lib/quiz";

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuizApp initialTestId={id} initialTests={defaultTests} />;
}