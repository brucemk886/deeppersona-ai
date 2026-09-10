import { TRAIT_KEYS, type QuizQuestion, type QuizTest } from "./quiz";

// Never serialize report copy into public API responses or client component props.
export function publicTest(test: QuizTest): QuizTest {
  const { results: _legacyResults, ...publicFields } = test;
  return publicFields;
}

export function publicQuestion(question: QuizQuestion): QuizQuestion {
  return {
    ...question,
    options: question.options.map((option) => ({
      label: option.label,
      microcopy: option.microcopy,
      meaning: "",
      projection: "",
      ...(option.styleKey ? { styleKey: option.styleKey } : {}),
      ...(option.cardTone ? { cardTone: option.cardTone } : {}),
    })),
  };
}
