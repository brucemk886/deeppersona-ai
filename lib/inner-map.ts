import type { QuizTest } from "@/lib/quiz";

export const INNER_DIMENSIONS = [
  { id: "connection", label: "Connection", description: "How you move toward closeness" },
  { id: "safety", label: "Safety", description: "What helps your system settle" },
  { id: "boundaries", label: "Boundaries", description: "How you protect space and repair tension" },
  { id: "expression", label: "Expression", description: "How care and emotion become visible" },
  { id: "energy", label: "Energy", description: "What restores or drains you" },
  { id: "direction", label: "Direction", description: "How you meet possibility and uncertainty" },
] as const;

export type InnerDimensionId = (typeof INNER_DIMENSIONS)[number]["id"];

export type InnerProfileSummary = {
  completedTestIds: string[];
  email?: string;
};

export const TEST_DIMENSIONS: Record<string, InnerDimensionId> = {
  "attachment-style": "connection",
  "emotional-needs": "safety",
  "conflict-style": "boundaries",
  "social-energy": "energy",
  "love-language": "expression",
  "stress-reset": "energy",
  "boundary-style": "boundaries",
  "hidden-strength": "direction",
};

export function getDimensionProgress(completedTestIds: string[]) {
  const completed = new Set(completedTestIds);
  return INNER_DIMENSIONS.map((dimension) => {
    const testIds = Object.entries(TEST_DIMENSIONS)
      .filter(([, dimensionId]) => dimensionId === dimension.id)
      .map(([testId]) => testId);
    const completedCount = testIds.filter((testId) => completed.has(testId)).length;
    return {
      ...dimension,
      completedCount,
      testCount: testIds.length,
      unlocked: completedCount > 0,
    };
  });
}

export function recommendNextTest(tests: QuizTest[], completedTestIds: string[], currentTestId?: string) {
  const completed = new Set(completedTestIds);
  const currentDimension = currentTestId ? TEST_DIMENSIONS[currentTestId] : undefined;
  const dimensionProgress = getDimensionProgress(completedTestIds);
  const active = tests.filter((test) => test.active && !completed.has(test.id));
  return (
    active.find((test) => currentDimension && TEST_DIMENSIONS[test.id] === currentDimension) ??
    active.find((test) => !dimensionProgress.find((dimension) => dimension.id === TEST_DIMENSIONS[test.id])?.unlocked) ??
    active[0] ??
    tests.find((test) => test.active && test.id !== currentTestId)
  );
}