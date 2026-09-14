import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

export type AiChoiceReading = {
  questionId: string;
  reading: string;
};

export type AiScene = {
  alarm: string;
  action: string;
};

export type AiInsightReport = {
  contradiction: {
    paradox: string;
    selfSabotage: string;
  };
  scenes: {
    closeness: AiScene;
    silence: AiScene;
    conflict: AiScene;
  };
  defense: {
    fear: string;
    excuse: string;
  };
  toolkit: {
    brake: string[];
    scripts: string[];
  };
};

export type AiReading = AiInsightReport & {
  summary?: string;
  reflectionPrompt?: string;
  choices?: AiChoiceReading[];
};

const STYLE_EN: Record<string, string> = {
  anxious: "Anxious-Preoccupied",
  avoidant: "Dismissing-Avoidant",
  secure: "Secure",
  fearful: "Fearful-Avoidant / Disorganized",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function cleanList(value: unknown, min: number, max: number): string[] {
  const rows = Array.isArray(value) ? value.map(cleanText).filter(Boolean) : [];
  return rows.slice(0, max).length >= min ? rows.slice(0, max) : [];
}

function cleanScene(value: unknown): AiScene | null {
  const record = asRecord(value);
  if (!record) return null;
  const alarm = cleanText(record.alarm);
  const action = cleanText(record.action);
  return alarm && action ? { alarm, action } : null;
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

export function hasLegacyChoiceReadings(value: unknown): value is { choices: AiChoiceReading[] } {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.choices)) return false;
  return record.choices.some((item) => {
    const row = asRecord(item);
    return Boolean(cleanText(row?.questionId) && cleanText(row?.reading));
  });
}

export function isInsightReport(value: unknown): value is AiInsightReport {
  const record = asRecord(value);
  if (!record) return false;
  const contradiction = asRecord(record.contradiction);
  const scenes = asRecord(record.scenes);
  const defense = asRecord(record.defense);
  const toolkit = asRecord(record.toolkit);
  return Boolean(
    cleanText(contradiction?.paradox)
    && cleanText(contradiction?.selfSabotage)
    && cleanScene(scenes?.closeness)
    && cleanScene(scenes?.silence)
    && cleanScene(scenes?.conflict)
    && cleanText(defense?.fear)
    && cleanText(defense?.excuse)
    && cleanList(toolkit?.brake, 3, 3).length === 3
    && cleanList(toolkit?.scripts, 2, 2).length === 2,
  );
}

export function buildAiReadingPrompt(
  _test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
  result: ResultProfile,
): { user: string } {
  const counts = { anxious: 0, avoidant: 0, secure: 0, fearful: 0 };
  for (const question of questions) {
    const key = question.options[choices[question.id]]?.styleKey;
    if (key && key in counts) counts[key as keyof typeof counts] += 1;
  }
  return {
    user: JSON.stringify({
      style: STYLE_EN[result.key] ?? result.title,
      styleKey: result.key,
      anxiety: result.anxiety ?? null,
      avoidance: result.avoidance ?? null,
      leanCounts: counts,
      language: "en",
      rule: "Do not list, quote, or retell any quiz item or option. Write the four-part report in English from the style and leanings only.",
    }),
  };
}

export function parseAiReading(raw: string): AiReading | null {
  let parsed: unknown;
  try {
    parsed = extractJsonObject(raw);
  } catch {
    return null;
  }
  const record = asRecord(parsed);
  if (!record) return null;
  const contradiction = asRecord(record.contradiction);
  const scenes = asRecord(record.scenes);
  const defense = asRecord(record.defense);
  const toolkit = asRecord(record.toolkit);
  const closeness = cleanScene(scenes?.closeness);
  const silence = cleanScene(scenes?.silence);
  const conflict = cleanScene(scenes?.conflict);
  const brake = cleanList(toolkit?.brake, 3, 3);
  const scripts = cleanList(toolkit?.scripts, 2, 2);
  const paradox = cleanText(contradiction?.paradox);
  const selfSabotage = cleanText(contradiction?.selfSabotage);
  const fear = cleanText(defense?.fear);
  const excuse = cleanText(defense?.excuse);
  if (!paradox || !selfSabotage || !closeness || !silence || !conflict || !fear || !excuse || brake.length !== 3 || scripts.length !== 2) {
    return null;
  }
  return {
    contradiction: { paradox, selfSabotage },
    scenes: { closeness, silence, conflict },
    defense: { fear, excuse },
    toolkit: { brake, scripts },
  };
}
