import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

export type AiChoiceReading = {
  questionId: string;
  reading: string;
};

// First DeepSeek format: one short reading per selected option. Kept only for stored snapshots.
export type LegacyChoiceReading = {
  summary?: string;
  reflectionPrompt?: string;
  choices: AiChoiceReading[];
};

export type AiScene = {
  alarm: string;
  action: string;
};

// Second format: four descriptive modules. Kept only for stored snapshots.
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

// Current format: a hook that stops right before the payoff, then the paid payoff.
export type AiInsightV2 = {
  version: 2;
  hook: {
    patternName: string;
    mirror: string;
    tell: string;
  };
  cost: string[];
  turningPoint: {
    setup: string;
    move: string;
    misread: string;
  };
  teasers: string[];
  throughTheirEyes: string;
  forecast: string;
  coverStory: string;
  toolkit: {
    brake: string[];
    scripts: string[];
  };
};

export type AiReading = AiInsightV2 | AiInsightReport | LegacyChoiceReading;

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
  return typeof value === "string" ? value.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim() : "";
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

export function hasLegacyChoiceReadings(value: unknown): value is LegacyChoiceReading {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.choices)) return false;
  return record.choices.some((item) => {
    const row = asRecord(item);
    return Boolean(cleanText(row?.questionId) && cleanText(row?.reading));
  });
}

export function hasCjkText(value: unknown): boolean {
  return /[\u3400-\u9fff]/.test(typeof value === "string" ? value : JSON.stringify(value ?? ""));
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

export function publicInsightReport(value: unknown): AiInsightReport | null {
  return isInsightReport(value) && !hasCjkText(value) ? value : null;
}

function readInsightV2(value: unknown): AiInsightV2 | null {
  const record = asRecord(value);
  if (!record) return null;
  const hook = asRecord(record.hook);
  const turningPoint = asRecord(record.turningPoint);
  const toolkit = asRecord(record.toolkit);
  const patternName = cleanText(hook?.patternName);
  const mirror = cleanText(hook?.mirror);
  const tell = cleanText(hook?.tell);
  const cost = cleanList(record.cost, 2, 3);
  const setup = cleanText(turningPoint?.setup);
  const move = cleanText(turningPoint?.move);
  const misread = cleanText(turningPoint?.misread);
  const teasers = cleanList(record.teasers, 3, 4);
  const throughTheirEyes = cleanText(record.throughTheirEyes);
  const forecast = cleanText(record.forecast);
  const coverStory = cleanText(record.coverStory);
  const brake = cleanList(toolkit?.brake, 3, 3);
  const scripts = cleanList(toolkit?.scripts, 2, 2);
  if (!patternName || !mirror || !tell || !cost.length || !setup || !move || !misread || !teasers.length
    || !throughTheirEyes || !forecast || !coverStory || brake.length !== 3 || scripts.length !== 2) {
    return null;
  }
  return {
    version: 2,
    hook: { patternName, mirror, tell },
    cost,
    turningPoint: { setup, move, misread },
    teasers,
    throughTheirEyes,
    forecast,
    coverStory,
    toolkit: { brake, scripts },
  };
}

export function isInsightV2(value: unknown): value is AiInsightV2 {
  return readInsightV2(value) !== null;
}

export function publicInsightV2(value: unknown): AiInsightV2 | null {
  const report = readInsightV2(value);
  return report && !hasCjkText(report) ? report : null;
}

// One upgrade attempt per report. Legacy per-choice snapshots stay as purchased.
export function needsAiUpgrade(deepResult: { aiReading?: unknown; aiUpgradeAttempted?: boolean }): boolean {
  if (deepResult.aiUpgradeAttempted) return false;
  if (hasLegacyChoiceReadings(deepResult.aiReading)) return false;
  return !publicInsightV2(deepResult.aiReading);
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
      rule: "Do not list, quote, or retell any quiz item or option. Write the reading in English from the style and leanings only.",
    }),
  };
}

export function parseAiReading(raw: string): AiInsightV2 | null {
  try {
    return readInsightV2(extractJsonObject(raw));
  } catch {
    return null;
  }
}
