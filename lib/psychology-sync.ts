import type { QuizQuestion, QuizTest } from "@/lib/quiz";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export function absoluteHttpsUrl(value: string, requestUrl: string): string {
  const url = new URL(value, requestUrl);
  url.protocol = "https:";
  return url.toString();
}

/** Stable Local Factory feed: official tests, prompts, options, and atlas images. */
export function buildPsychologySyncFeed(
  tests: QuizTest[],
  questions: QuizQuestion[],
  requestUrl: string,
) {
  const testById = new Map(tests.map((test) => [test.id, test]));

  return {
    source: "deeppersona-ai",
    tests: tests.map((test) => ({
      id: test.id,
      title: test.title,
      kicker: test.kicker,
      description: test.description,
      coverImageUrl: absoluteHttpsUrl(test.coverAtlasPath, requestUrl),
      position: test.position,
      questionCount: test.questionCount ?? 0,
    })),
    items: questions.map((question) => {
      const test = testById.get(question.testId);
      return {
        id: question.id,
        testId: question.testId,
        testTitle: test?.title ?? question.testId,
        testKicker: test?.kicker ?? "",
        kicker: question.kicker,
        prompt: question.prompt,
        question: question.prompt,
        imageUrl: absoluteHttpsUrl(question.atlasPath, requestUrl),
        position: question.position,
        options: question.options.map((option, index) => ({
          letter: OPTION_LETTERS[index] ?? String.fromCharCode(65 + index),
          label: option.label,
          text: option.label,
          microcopy: option.microcopy,
          scoreKey: option.scoreKey,
          meaning: option.meaning,
          projection: option.projection,
        })),
      };
    }),
  };
}
