import { getRuntimeEnv } from "@/db/quiz-store";
import { buildAiReadingPrompt, hasCjkText, needsAiUpgrade, parseAiReading, type AiInsightV2 } from "./ai-reading-parse";
import type { ReportSnapshot } from "./payment-types";
import type { QuizQuestion, QuizTest, ResultProfile } from "./quiz";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";
const ATTACHMENT_KEYS = new Set(["anxious", "avoidant", "secure", "fearful"]);

export { buildAiReadingPrompt } from "./ai-reading-parse";

const SYSTEM_PROMPT = `You write the attachment reading for an English quiz site. Voice: a sharp friend who happens to be a trauma-trained clinician. Spoken English. Second person, present tense. No hedging ("may", "might", "tend to", "often", "can"). No brochure words ("journey", "healing", "navigate", "hold space", "boundaries", "self-care"). No adjective lists. Every paragraph carries at least one concrete detail: a time of night, a phone face-down on the table, a third date, a reply left on read, a specific sentence someone said.

The reader sees the first three parts free. Their job is to make the reader feel caught, then stop right before the part they most want. Everything after that is paid, and it has to pay off the promise.

Return JSON only, exactly this shape:
{
  "version": 2,
  "hook": {
    "patternName": "3-5 words that name their specific move, not the attachment label. Examples of the register: 'The Pre-emptive Exit', 'The 11pm Audit', 'The Two-Day Freeze'. Invent one that fits this person.",
    "mirror": "6-8 sentences. Open inside a scene they will recognize. Show what they do, then what they tell themselves in that moment, then what actually happened. The final sentence should land like being seen through, not like advice.",
    "tell": "2 sentences. The small thing they do that they believe nobody notices. Specific enough to be slightly uncomfortable."
  },
  "cost": [
    "one sentence, concrete, phrased as a loss they have already paid",
    "one sentence",
    "one sentence"
  ],
  "turningPoint": {
    "setup": "3-4 sentences building the exact moment they lose people. Stop right before the move itself. End on a cliff.",
    "move": "3-4 sentences describing the move precisely: what they say, send, or stop doing.",
    "misread": "3-4 sentences on how the other person reads that move, and why it lands as the opposite of what was meant."
  },
  "teasers": [
    "one sentence promising the 'move + misread' section, phrased as something they will learn, no resolution",
    "one sentence promising the partner's-eye section: what the other person has already concluded but not said",
    "one sentence promising the forecast: what the next 60 days look like if nothing changes",
    "one sentence promising the exact text they can send instead of the move"
  ],
  "throughTheirEyes": "5-6 sentences from the partner's side. What they see, what they quietly stop doing, what they have already decided but not said out loud.",
  "forecast": "5-6 sentences: the next 30 to 60 days if nothing changes. Specific, plausible, with a rough timeline.",
  "coverStory": "4-5 sentences: the excuse they use for the distance, why it sounds reasonable, and the one detail that gives it away.",
  "toolkit": {
    "brake": ["step 1, physical, under 15 words", "step 2", "step 3"],
    "scripts": ["a text they can send as-is, under 40 words", "a second one, different situation"]
  }
}

Never write "this reading", "according to your results", "this is not a judgment", or "everyone does this sometimes". Never quote or list quiz items or options. English only.`;

export function hasAiKey(): boolean {
  return Boolean(getRuntimeEnv().DEEPSEEK_API_KEY?.trim());
}

export async function generateAiReading(
  test: QuizTest,
  questions: QuizQuestion[],
  choices: Record<string, number>,
  result: ResultProfile,
): Promise<AiInsightV2 | null> {
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
        temperature: 0.6,
        max_tokens: 6000,
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
  if (next && !hasCjkText(next)) {
    snapshot.deepResult.aiReading = next;
    snapshot.deepResult.aiReadingVersion = 2;
  }
  return true;
}
