import { listQuestions, listTests } from "@/db/quiz-store";
import { headers } from "next/headers";
import { publicTest, publicQuestion } from "@/lib/public-quiz";
import { localizeRelationshipQuestions, quizLocaleFromAcceptLanguage } from "@/lib/relationship-zh";
import type { Metadata } from "next";
import { QuizApp } from "./quiz-app";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const locale = quizLocaleFromAcceptLanguage((await headers()).get("accept-language"));
  const [tests, questions] = await Promise.all([listTests(), listQuestions()]);
  return <QuizApp initialLocale={locale} initialTests={tests.map(publicTest)} initialQuestions={localizeRelationshipQuestions(questions, locale).map(publicQuestion)} />;
}
