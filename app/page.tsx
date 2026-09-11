import { listQuestions, listTests } from "@/db/quiz-store";
import { publicTest, publicQuestion } from "@/lib/public-quiz";
import type { Metadata } from "next";
import { QuizApp } from "./quiz-app";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [tests, questions] = await Promise.all([listTests(), listQuestions()]);
  return <QuizApp initialTests={tests.map(publicTest)} initialQuestions={questions.map(publicQuestion)} />;
}
