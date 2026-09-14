import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";
import type { DeepResultContent } from "./deep-results";
import type { DimensionScore, WorthLevel } from "./attachment";

export type ReportSnapshot = {
  test: QuizTest;
  result: ResultProfile;
  questions: QuizQuestion[];
  answerChoices: Record<string, number>;
  deepResult: DeepResultContent;
};

export type ReportPreview = {
  totalChoices: number;
  modules: string[];
  romanceEssay?: string;
  scores?: DimensionScore;
  caregiver?: { intro: string } & DimensionScore;
  selfWorth?: { level: WorthLevel; percent: number; sentences: string };
  inclusions?: string[];
  aiInsight?: {
    paradox: string;
    selfSabotage: string;
    closeness: { alarm: string; action: string };
    silenceAlarm: string;
    conflictAlarm: string;
    fear: string;
  };
  aiInsightV2?: {
    patternName: string;
    mirror: string;
    tell: string;
    cost: string[];
    turningPointSetup: string;
    teasers: string[];
  };
  sample?: {
    moduleTitle: string;
    explanation: string;
    reflection: string;
    choice: {
      questionNumber: number;
      prompt: string;
      label: string;
      meaning: string;
      atlasPath: string;
      selectedIndex: number;
    };
  };
};

export type ReportResponse = {
  preview?: ReportPreview;
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
