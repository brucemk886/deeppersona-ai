import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

export type AiChoiceReading = {
  questionId: string;
  reading: string;
};

export type AiReading = {
  summary: string;
  reflectionPrompt?: string;
  choices: AiChoiceReading[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function extractJsonObject(raw: string): unknown {
  const text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("AI reading was not valid JSON.");
  }
}

export function buildAiReadingPrompt(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
  result: ResultProfile,
): { questionIds: string[]; user: string } {
  const selected = questions.flatMap((question, index) => {
    const option = question.options[choices[question.id]];
    if (!option) return [];
    return [{
      questionId: question.id,
      number: index + 1,
      prompt: question.prompt,
      label: option.label,
      styleKey: option.styleKey ?? "",
    }];
  });
  return {
    questionIds: selected.map((item) => item.questionId),
    user: JSON.stringify({
      testTitle: test.title,
      resultTitle: result.title,
      resultSummary: result.summary,
      instruction: "Write a reflection-only reading from the chosen option wording. Include every questionId in choices. Do not diagnose, pathologize, or invent facts that are not in the choices. Quote or paraphrase the selected wording. Return JSON only.",
      choices: selected,
    }),
  };
}

export function parseAiReading(
  raw: string,
  questionIds: string[] = [],
  options: { requireSummary?: boolean } = {},
): AiReading | null {
  const allowed = new Set(questionIds);
  let parsed: unknown;
  try {
    parsed = extractJsonObject(raw);
  } catch {
    return null;
  }
  const record = asRecord(parsed);
  if (!record) return null;
  const summary = cleanText(record.summary);
  if (!summary && options.requireSummary !== false) return null;
  const reflectionPrompt = cleanText(record.reflectionPrompt);
  const rows = Array.isArray(record.choices) ? record.choices : [];
  const seen = new Set<string>();
  const choices: AiChoiceReading[] = [];
  for (const row of rows) {
    const item = asRecord(row);
    if (!item) continue;
    const questionId = cleanText(item.questionId);
    const reading = cleanText(item.reading);
    if (!questionId || !reading || seen.has(questionId)) continue;
    if (allowed.size && !allowed.has(questionId)) continue;
    seen.add(questionId);
    choices.push({ questionId, reading });
  }
  if (!choices.length) return null;
  return {
    summary,
    ...(reflectionPrompt ? { reflectionPrompt } : {}),
    choices,
  };
}

export function mergeAiReadings(base: AiReading | null, next: AiReading, questionIds: string[]): AiReading | null {
  const byId = new Map((base?.choices ?? []).map((item) => [item.questionId, item]));
  for (const item of next.choices) {
    if (!byId.has(item.questionId)) byId.set(item.questionId, item);
  }
  const choices = questionIds.flatMap((questionId) => {
    const item = byId.get(questionId);
    return item ? [item] : [];
  });
  const summary = cleanText(base?.summary) || cleanText(next.summary);
  if (!summary || !choices.length) return null;
  const reflectionPrompt = cleanText(base?.reflectionPrompt) || cleanText(next.reflectionPrompt);
  return {
    summary,
    ...(reflectionPrompt ? { reflectionPrompt } : {}),
    choices,
  };
}
