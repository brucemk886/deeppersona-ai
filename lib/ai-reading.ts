import { getRuntimeEnv } from "@/db/quiz-store";
import { buildAiReadingPrompt, mergeAiReadings, parseAiReading, type AiReading } from "./ai-reading-parse";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";

export { buildAiReadingPrompt } from "./ai-reading-parse";

async function requestDeepSeek(
  apiKey: string,
  user: string,
  questionIds: string[],
  requireSummary: boolean,
): Promise<AiReading | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
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
        temperature: 0.3,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        messages: [
          {
            role: "system",
            content: "You write concise attachment-style reflections for DeepPersona AI. Reply with JSON: {\"summary\": string, \"reflectionPrompt\": string, \"choices\": [{\"questionId\": string, \"reading\": string}]}. Include every requested questionId. Two sentences per reading. English only. No medical or diagnostic claims.",
          },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return parseAiReading(payload.choices?.[0]?.message?.content ?? "", questionIds, { requireSummary });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateAiReading(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
  result: ResultProfile,
): Promise<AiReading | null> {
  const apiKey = getRuntimeEnv().DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;
  const built = buildAiReadingPrompt(test, questions, choices, result);
  if (!built.questionIds.length) return null;

  const first = await requestDeepSeek(apiKey, built.user, built.questionIds, true);
  let reading = first;
  const missing = built.questionIds.filter((questionId) => !reading?.choices.some((item) => item.questionId === questionId));
  if (reading && missing.length) {
    const leftover = JSON.parse(built.user) as { choices?: Array<{ questionId: string }> };
    const remaining = {
      instruction: "Continue the same reading. Write ONLY the missing questionIds. summary may be empty. Return JSON only.",
      choices: (leftover.choices ?? []).filter((item) => missing.includes(item.questionId)),
    };
    const extra = await requestDeepSeek(apiKey, JSON.stringify(remaining), missing, false);
    if (extra) reading = mergeAiReadings(reading, extra, built.questionIds);
  }
  return reading;
}
