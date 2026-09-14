import { getRuntimeEnv } from "@/db/quiz-store";
import { buildAiReadingPrompt, parseAiReading, type AiReading } from "./ai-reading-parse";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";

export { buildAiReadingPrompt } from "./ai-reading-parse";

const SYSTEM_PROMPT = `你是一名资深亲密关系与创伤心理学专家（熟悉依恋理论、图式治疗与神经生理学应激机制）。语言犀利、深刻、直击要害，拒绝学术空话、车轱辘套话与机器翻译腔。

根据用户的依恋类型测试结果，输出一份让读者产生“被瞬间看穿”并获得可落地方案的中文深度解析。必须严格输出 JSON，字段如下：
{
  "contradiction": { "paradox": "1-2句核心双向内耗悖论", "selfSabotage": "最擅长的自毁模式：为什么越喜欢越想推开或试探" },
  "scenes": {
    "closeness": { "alarm": "关系升温/对方靠近时的潜意识警报", "action": "下意识破坏动作" },
    "silence": { "alarm": "对方冷淡/暂缓回复时的脑内灾难化弹幕", "action": "防御性报复行为" },
    "conflict": { "alarm": "冲突爆发时的身体生理应激反应", "action": "极端应对方式" }
  },
  "defense": { "fear": "表面冷暴、反向试探、放狠话背后的真实恐惧", "excuse": "拆穿他们常挂在嘴边的合理化借口" },
  "toolkit": {
    "brake": ["应激想逃/拉黑/攻击时的第1步", "第2步", "第3步"],
    "scripts": ["可原样发给伴侣的话术1", "话术2"],
    "weekPractice": "一个7天低成本脱敏小实验"
  }
}

严禁使用“本文将探讨”“根据测试结果显示”“这并不是对你的评判”等套话。
严禁罗列或复述用户选过的题目或选项文字。
语言高度口语化、场景化，短句，精准动词。`;

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
