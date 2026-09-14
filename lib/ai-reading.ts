import { getRuntimeEnv } from "@/db/quiz-store";
import { buildAiReadingPrompt, hasCjkText, parseAiReading, publicInsightReport, shouldRefreshAiReading, type AiReading } from "./ai-reading-parse";
import type { ReportSnapshot } from "./payment-types";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";

export { buildAiReadingPrompt } from "./ai-reading-parse";

const SYSTEM_PROMPT = `You are a senior clinician in adult attachment, schema therapy, and stress physiology. Write in sharp, spoken English. No academic padding, no brochure tone, no translated-from-Chinese cadence.

Write a high-insight reading from the user's attachment result. The free excerpt has to hook them in the first screen: they should feel caught, a little exposed, and hungry for the rest. Return JSON only:
{
  "contradiction": { "paradox": "4-6 spoken sentences on the core push-pull. Name the want and the flinch in the same breath.", "selfSabotage": "4-6 sentences on why liking someone harder makes them test, go cold, or pick a fight. Use one concrete late-night or after-date scene." },
  "scenes": {
    "closeness": { "alarm": "3-4 sentences of the private alarm when the other person moves closer", "action": "3-4 sentences of the reflex that starts to break it" },
    "silence": { "alarm": "3-4 sentences of the catastrophe script when a reply is slow", "action": "3-4 sentences of the retaliatory move" },
    "conflict": { "alarm": "3-4 sentences of what the body does when a fight starts", "action": "3-4 sentences of the extreme move" }
  },
  "defense": { "fear": "4-5 sentences on the real fear under coldness, testing, and harsh lines", "excuse": "3-4 sentences on the story they tell themselves instead. End on a line that makes the excuse sound thin." },
  "toolkit": {
    "brake": ["step 1 when they want to flee, block, or attack", "step 2", "step 3"],
    "scripts": ["a line they can send as-is", "a second line they can send as-is"]
  }
}

Do not write "this article will explore", "according to your test results", or "this is not a judgment".
Do not list or quote any quiz item or option wording.
Spoken English. Precise verbs. English only.`;

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

export { shouldRefreshAiReading } from "./ai-reading-parse";

export async function freezeAiReading(snapshot: ReportSnapshot): Promise<boolean> {
  if (snapshot.deepResult.aiReadingFrozen) return false;
  if (publicInsightReport(snapshot.deepResult.aiReading)) {
    snapshot.deepResult.aiReadingFrozen = true;
    return true;
  }
  if (!shouldRefreshAiReading(snapshot.deepResult)) return false;
  snapshot.deepResult.aiRewriteAttempted = true;
  const next = await generateAiReading(snapshot.test, snapshot.questions, snapshot.answerChoices, snapshot.result);
  if (next && !hasCjkText(next)) {
    snapshot.deepResult.aiReading = next;
    snapshot.deepResult.aiReadingFrozen = true;
  }
  return true;
}
