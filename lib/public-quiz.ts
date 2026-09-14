import { type QuizOption, type QuizQuestion, type QuizTest } from "./quiz";

export function catalogOption(option: Partial<QuizOption>, index = 0): QuizOption {
  return {
    label: option.label?.trim() || `Choice ${String.fromCharCode(65 + index)}`,
    microcopy: "",
    meaning: "",
    projection: "",
    ...(option.readingFocus ? { readingFocus: option.readingFocus } : {}),
    ...(option.styleKey ? { styleKey: option.styleKey } : {}),
    ...(option.cardTone ? { cardTone: option.cardTone } : {}),
  };
}

export function catalogQuestion(question: QuizQuestion): QuizQuestion {
  return {
    ...question,
    options: question.options.map((option, index) => catalogOption(option, index)),
  };
}

// Never serialize report copy into public API responses or client component props.
export function publicTest(test: QuizTest): QuizTest {
  const { results: _legacyResults, ...publicFields } = test;
  return publicFields;
}

export function publicQuestion(question: QuizQuestion): QuizQuestion {
  return catalogQuestion(question);
}
