import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";
import type { DeepResultContent } from "./deep-results";

export type ReportSnapshot = {
  test: QuizTest;
  result: ResultProfile;
  questions: QuizQuestion[];
  answerChoices: Record<string, number>;
  deepResult: DeepResultContent;
};

export type ReportResponse = {
  id: string;
  unlocked: boolean;
  status: string;
  amountCents: number;
  currency: "usd";
  sandbox: boolean;
  checkoutReady: boolean;
  refundPolicy: string;
  test: QuizTest;
  result: ResultProfile;
  questions?: QuizQuestion[];
  answerChoices?: Record<string, number>;
  deepResult?: ReportSnapshot["deepResult"];
};
