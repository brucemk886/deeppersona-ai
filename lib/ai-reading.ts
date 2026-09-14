import { getRuntimeEnv } from "@/db/quiz-store";
import { buildAiReadingPrompt, parseAiReading, type AiReading } from "./ai-reading-parse";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";

export { buildAiReadingPrompt } from "./ai-reading-parse";

export async function generateAiReading(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
  result: ResultProfile,
): Promise<AiReading | null> {
  const apiKey = getRuntimeEnv().DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;
  const { questionIds, user } = buildAiReadingPrompt(test, questions, choices, result);
  if (!questionIds.length) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
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
        max_tokens: 4000,
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        messages: [
          {
            role: "system",
            content: "You write concise attachment-style reflections for DeepPersona AI. Reply with JSON: {\"summary\": string, \"reflectionPrompt\": string, \"choices\": [{\"questionId\": string, \"reading\": string}]}. One reading per selected questionId. English only. No medical or diagnostic claims.",
          },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return parseAiReading(payload.choices?.[0]?.message?.content ?? "", questionIds);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
