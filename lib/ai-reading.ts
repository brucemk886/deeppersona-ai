import { getRuntimeEnv } from "@/db/quiz-store";
import { buildAiReadingPrompt, hasCjkText, parseAiReading, type AiReading } from "./ai-reading-parse";
import type { ReportSnapshot } from "./payment-types";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";

export { buildAiReadingPrompt } from "./ai-reading-parse";

const SYSTEM_PROMPT = `You are a senior clinician in adult attachment, schema therapy, and stress physiology. Write in sharp, spoken English. No academic padding, no brochure tone, no translated-from-Chinese cadence.

Write a high-insight reading from the user's attachment result. The reader should feel seen and leave with something they can actually do. Return JSON only:
{
  "contradiction": { "paradox": "1-2 sentences on the core push-pull", "selfSabotage": "why liking someone harder makes them test or push the person away" },
  "scenes": {
    "closeness": { "alarm": "the private alarm when the other person moves closer", "action": "the reflex that starts to break it" },
    "silence": { "alarm": "the catastrophe script when a reply is slow", "action": "the retaliatory move" },
    "conflict": { "alarm": "what the body does when a fight starts", "action": "the extreme move" }
  },
  "defense": { "fear": "the real fear under coldness, testing, and harsh lines", "excuse": "the story they tell themselves instead" },
  "toolkit": {
    "brake": ["step 1 when they want to flee, block, or attack", "step 2", "step 3"],
    "scripts": ["a line they can send as-is", "a second line they can send as-is"]
  }
}

Do not write "this article will explore", "according to your test results", or "this is not a judgment".
Do not list or quote any quiz item or option wording.
Short sentences. Precise verbs. English only.`;

export async function generateAiReading(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
  result: ResultProfile,
): Promise<AiReading | null> {
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
        temperature: 0.7,
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

export async function replaceCjkAiReading(snapshot: ReportSnapshot): Promise<boolean> {
  if (!hasCjkText(snapshot.deepResult.aiReading)) return false;
  const next = await generateAiReading(snapshot.test, snapshot.questions, snapshot.answerChoices, snapshot.result);
  if (!next || hasCjkText(next)) return false;
  snapshot.deepResult.aiReading = next;
  return true;
}
