import { QuizApp } from "./quiz-app";
import { defaultQuestions } from "@/lib/quiz";

export default function Home() {
  return <QuizApp initialQuestions={defaultQuestions} />;
}
