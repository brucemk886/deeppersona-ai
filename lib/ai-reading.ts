import { getRuntimeEnv } from "@/db/quiz-store";
import {
  buildAiReadingPrompt,
  hasCjkText,
  needsAiUpgrade,
  parseAiReading,
  type AiAttachmentModules,
} from "./ai-reading-parse";
import type { DeepResultContent } from "./deep-results";
import type { ReportSnapshot } from "./payment-types";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";
const ATTACHMENT_KEYS = new Set(["anxious", "avoidant", "secure", "fearful"]);

export { buildAiReadingPrompt } from "./ai-reading-parse";

const SYSTEM_PROMPT = `You write the attachment report for an English quiz site. The page uses the same modules as a standard attachment-style result: romantic patterns, romantic characteristics, superpowers, triggers, how they see themselves, self-talk rewrites, dating / conflict / need, and how this style meets the other three.

You are analyzing the person's actual first-reaction answers, not a generic type essay. The JSON they send includes every moment they faced and the first move they picked. Use those moves as evidence. If anxious and avoidant answers sit next to each other, name that mix. If most answers cluster one way with two sharp exceptions, keep the exceptions.

Voice: clear, specific, second person, present tense. Short sentences. No brochure words ("journey", "healing", "navigate", "hold space"). No guest-services lines ("this reading", "according to your results", "this is not a judgment"). No invented late-night novel, no cliffhangers, no "unlock" language, no 7-day plan.

Return JSON only, exactly this shape:
{
  "version": 3,
  "romanceEssay": "8-12 sentences. How they actually move in romance, drawn from their first-reaction answers: silence, affection, cancelations, labels, fights. Name the pattern, then the cost, then what they are protecting. Paraphrase 3-5 revealing answers. Do not quote a stack of quiz items.",
  "characteristics": [
    "5-7 short bullets. Each is one romantic characteristic this person showed in the answers, not a generic type list."
  ],
  "superpowers": [
    "exactly 3 bullets. Strengths that showed up in the answers, even inside an insecure pattern."
  ],
  "triggers": [
    "exactly 3 bullets. Moments from the answers that reliably set them off."
  ],
  "selfWorthSentences": "4-6 sentences on how they treat their own worth in these answers: checking, shrinking, armoring, proving, or staying steady.",
  "rewrites": [
    { "from": "the line they already tell themselves, taken from the answers", "to": "a shorter replacement they can use in the same moment" },
    { "from": "...", "to": "..." },
    { "from": "...", "to": "..." }
  ],
  "essay": {
    "dating": "4-6 sentences from the dating / texting / pace answers.",
    "conflict": "4-6 sentences from the fight / shutdown / chase answers.",
    "need": "4-6 sentences on the concrete thing they need next, inferred from the answers. No worksheet."
  },
  "pairing": [
    { "style": "Anxious-Preoccupied", "note": "3-4 sentences: how THIS person's answers would meet an anxious partner." },
    { "style": "Dismissing-Avoidant", "note": "3-4 sentences." },
    { "style": "Secure", "note": "3-4 sentences." },
    { "style": "Fearful-Avoidant", "note": "3-4 sentences." }
  ],
  "caregiverIntro": "Omit this key unless childhoodMoves was sent. If sent: 4-6 sentences on the caregiver pattern those answers show. Do not blame parents."
}

pairing.style must use those four labels exactly. English only.`;

export function hasAiKey(): boolean {
  return Boolean(getRuntimeEnv().DEEPSEEK_API_KEY?.trim());
}

export function applyAiModules(deepResult: DeepResultContent, reading: AiAttachmentModules) {
  deepResult.aiReading = reading;
  deepResult.aiReadingVersion = 3;
  deepResult.romanceEssay = reading.romanceEssay;
  deepResult.characteristics = reading.characteristics;
  deepResult.superpowers = reading.superpowers;
  deepResult.triggers = reading.triggers;
  deepResult.essay = reading.essay;
  deepResult.pairing = reading.pairing;
  if (deepResult.selfWorth) {
    deepResult.selfWorth = { ...deepResult.selfWorth, sentences: reading.selfWorthSentences };
  }
  deepResult.selfEsteem = {
    title: deepResult.selfEsteem?.title ?? "Your worth pattern",
    paragraphs: [reading.selfWorthSentences, ...(deepResult.selfEsteem?.paragraphs.slice(1) ?? [])].filter(Boolean),
    rewrites: reading.rewrites,
  };
  if (reading.caregiverIntro && deepResult.caregiver) {
    deepResult.caregiver = { ...deepResult.caregiver, intro: reading.caregiverIntro };
  }
}

export async function generateAiReading(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
  result: ResultProfile,
): Promise<AiAttachmentModules | null> {
  const apiKey = getRuntimeEnv().DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;
  const { user } = buildAiReadingPrompt(test, questions, choices, result);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.4,
        max_tokens: 5000,
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return parseAiReading(payload.choices?.[0]?.message?.content ?? "");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Runs at most once per stored report, then the reading is fixed. Returns true when the snapshot changed.
export async function upgradeAiReading(snapshot: ReportSnapshot): Promise<boolean> {
  if (!hasAiKey() || !ATTACHMENT_KEYS.has(snapshot.result.key)) return false;
  if (!needsAiUpgrade(snapshot.deepResult)) return false;
  snapshot.deepResult.aiUpgradeAttempted = true;
  const next = await generateAiReading(snapshot.test, snapshot.questions, snapshot.answerChoices, snapshot.result);
  if (next && !hasCjkText(next)) applyAiModules(snapshot.deepResult, next);
  return true;
}
