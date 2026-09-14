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

// Third format: marketing hook. Kept only for stored snapshots.
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

export type AiRewrite = {
  from: string;
  to: string;
};

export type AiPairing = {
  style: string;
  note: string;
};

// Current format: Attachment Project-style modules written from the user's answers.
export type AiAttachmentModules = {
  version: 3;
  romanceEssay: string;
  characteristics: string[];
  superpowers: string[];
  triggers: string[];
  selfWorthSentences: string;
  rewrites: AiRewrite[];
  essay: {
    dating: string;
    conflict: string;
    need: string;
  };
  pairing: AiPairing[];
  caregiverIntro?: string;
};

export type AiReading = AiAttachmentModules | AiInsightV2 | AiInsightReport | LegacyChoiceReading;

export const STYLE_EN: Record<string, string> = {
  anxious: "Anxious-Preoccupied",
  avoidant: "Dismissing-Avoidant",
  secure: "Secure",
  fearful: "Fearful-Avoidant",
};

const PAIRING_STYLES = new Set(Object.values(STYLE_EN));

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

export function isInsightV2(value: unknown): value is AiInsightV2 {
  const record = asRecord(value);
  return Boolean(record && record.version === 2 && asRecord(record.hook)?.patternName);
}

function readAttachmentModules(value: unknown): AiAttachmentModules | null {
  const record = asRecord(value);
  if (!record) return null;
  const essay = asRecord(record.essay);
  const romanceEssay = cleanText(record.romanceEssay);
  const characteristics = cleanList(record.characteristics, 4, 8);
  const superpowers = cleanList(record.superpowers, 3, 4);
  const triggers = cleanList(record.triggers, 3, 4);
  const selfWorthSentences = cleanText(record.selfWorthSentences);
  const dating = cleanText(essay?.dating);
  const conflict = cleanText(essay?.conflict);
  const need = cleanText(essay?.need);
  const caregiverIntro = cleanText(record.caregiverIntro) || undefined;
  const rewrites = Array.isArray(record.rewrites)
    ? record.rewrites.flatMap((item) => {
      const row = asRecord(item);
      const from = cleanText(row?.from);
      const to = cleanText(row?.to);
      return from && to ? [{ from, to }] : [];
    }).slice(0, 3)
    : [];
  const pairing = Array.isArray(record.pairing)
    ? record.pairing.flatMap((item) => {
      const row = asRecord(item);
      const style = cleanText(row?.style);
      const note = cleanText(row?.note);
      return style && note && PAIRING_STYLES.has(style) ? [{ style, note }] : [];
    }).slice(0, 4)
    : [];
  if (!romanceEssay || characteristics.length < 4 || superpowers.length < 3 || triggers.length < 3
    || !selfWorthSentences || rewrites.length < 2 || !dating || !conflict || !need || pairing.length < 3) {
    return null;
  }
  return {
    version: 3,
    romanceEssay,
    characteristics,
    superpowers,
    triggers,
    selfWorthSentences,
    rewrites,
    essay: { dating, conflict, need },
    pairing,
    ...(caregiverIntro ? { caregiverIntro } : {}),
  };
}

export function isAttachmentModules(value: unknown): value is AiAttachmentModules {
  return readAttachmentModules(value) !== null;
}

export function publicAttachmentModules(value: unknown): AiAttachmentModules | null {
  const report = readAttachmentModules(value);
  return report && !hasCjkText(report) ? report : null;
}

// One upgrade attempt per report. Purchased per-choice snapshots stay as purchased.
export function needsAiUpgrade(deepResult: { aiReading?: unknown; aiUpgradeAttempted?: boolean }): boolean {
  if (deepResult.aiUpgradeAttempted) return false;
  if (hasLegacyChoiceReadings(deepResult.aiReading)) return false;
  return !publicAttachmentModules(deepResult.aiReading);
}

export function selectedFirstMoves(
  questions: QuizQuestion[],
  choices: Record<string, number>,
) {
  return questions.flatMap((question, index) => {
    const option = question.options[choices[question.id]];
    if (!option) return [];
    return [{
      section: question.kicker || "First reaction",
      moment: question.prompt,
      firstMove: option.label,
      lean: STYLE_EN[option.styleKey ?? ""] ?? option.styleKey ?? "unspecified",
      n: index + 1,
    }];
  });
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
  const firstMoves = selectedFirstMoves(questions, choices);
  const childhood = firstMoves.filter((item) => /childhood|caregiver/i.test(item.section));
  return {
    user: JSON.stringify({
      style: STYLE_EN[result.key] ?? result.title,
      styleKey: result.key,
      anxiety: result.anxiety ?? null,
      avoidance: result.avoidance ?? null,
      leanCounts: counts,
      language: "en",
      firstMoves,
      childhoodMoves: childhood.length ? childhood : undefined,
      rule: "Analyze THIS person's pattern from firstMoves. Do not invent a childhood history unless childhoodMoves is present. Do not list every item. Weave 3-5 of the most revealing first moves into the prose by paraphrasing them. English only.",
    }),
  };
}

export function parseAiReading(raw: string): AiAttachmentModules | null {
  try {
    return readAttachmentModules(extractJsonObject(raw));
  } catch {
    return null;
  }
}
