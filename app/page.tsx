import type { Metadata } from "next";
import { QuizApp } from "./quiz-app";
import { defaultTests } from "@/lib/quiz";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <QuizApp initialTests={defaultTests} />;
}
