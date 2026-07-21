import { QuizApp } from "./quiz-app";
import { defaultTests } from "@/lib/quiz";

export default function Home() {
  return <QuizApp initialTests={defaultTests} />;
}
