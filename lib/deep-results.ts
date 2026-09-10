import { buildTypedResult } from "@/lib/result-profiles";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

export type DeepResultContent = {
  lens: { title: string; explanation: string; reflectionPrompt: string };
  depth?: { coreDrive: string; inRelationships: string; underPressure: string };
};

export function buildChoiceReport(test: QuizTest, questions: QuizQuestion[], choices: Record<string, number>): { result: ResultProfile; deepResult: DeepResultContent } {
  const orderedIndexes = questions.map((question) => choices[question.id]).filter((index): index is number => Number.isInteger(index));
  const typed = buildTypedResult(test.id, orderedIndexes);
  return {
    result: {
      key: "choices",
      eyebrow: "Your free summary",
      title: typed.copy.title,
      summary: typed.copy.summary,
      strength: typed.copy.superpower,
      watchout: typed.copy.trigger,
      nextStep: typed.copy.inRelationships,
      axes: typed.axes,
      lockedModules: typed.lockedModules,
    },
    deepResult: {
      lens: {
        title: typed.copy.title,
        explanation: typed.copy.summary,
        reflectionPrompt: `When does "${typed.copy.title.toLowerCase()}" help you, and when does it cost you more than it gives?`,
      },
      depth: {
        coreDrive: typed.copy.coreDrive,
        inRelationships: typed.copy.inRelationships,
        underPressure: typed.copy.underPressure,
      },
    },
  };
}
