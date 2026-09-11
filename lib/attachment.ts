import type { QuizQuestion, ResultProfile } from "./quiz";

export const ATTACHMENT_STYLES = ["anxious", "avoidant", "secure", "fearful"] as const;

export type AttachmentStyle = (typeof ATTACHMENT_STYLES)[number];

export const ATTACHMENT_STYLE_META: Record<
  AttachmentStyle,
  { label: string; shortLabel: string; accent: string; blurb: string }
> = {
  anxious: {
    label: "Anxious",
    shortLabel: "Anxious",
    accent: "#9b4f5e",
    blurb: "You move toward closeness when something feels uncertain.",
  },
  avoidant: {
    label: "Avoidant",
    shortLabel: "Avoidant",
    accent: "#3d6b62",
    blurb: "You protect calm and independence when closeness intensifies.",
  },
  secure: {
    label: "Secure",
    shortLabel: "Secure",
    accent: "#214c3c",
    blurb: "You can stay connected without losing your own ground.",
  },
  fearful: {
    label: "Fearful-Avoidant",
    shortLabel: "Fearful-Avoidant",
    accent: "#6c5a91",
    blurb: "You want closeness and also need a way out when it feels like too much.",
  },
};

/** Visual-theme leanings used when an option has readingFocus instead of a style key. */
export const THEME_DIMENSIONS: Record<string, { anxiety: number; avoidance: number }> = {
  reassurance: { anxiety: 2, avoidance: 0 },
  presence: { anxiety: 2, avoidance: 0 },
  voice: { anxiety: 2, avoidance: 0 },
  action: { anxiety: 2, avoidance: 0 },
  novelty: { anxiety: 0, avoidance: 0 },
  planning: { anxiety: 0, avoidance: 0 },
  community: { anxiety: 0, avoidance: 1 },
  reflection: { anxiety: 2, avoidance: 2 },
  space: { anxiety: 0, avoidance: 2 },
  rest: { anxiety: 0, avoidance: 2 },
};

export const ATTACHMENT_RESULTS: Record<AttachmentStyle, Omit<ResultProfile, "key">> = {
  anxious: {
    eyebrow: "Your free attachment summary",
    title: "Anxious",
    summary:
      "When a bond feels unclear, your attention often goes to the relationship first. You look for a signal that you still matter, and silence can feel louder than it is.",
    strength: "You notice small shifts in closeness and are willing to repair.",
    watchout: "Waiting for reassurance can take over the rest of your day.",
    nextStep: "Name one need in plain language before checking the phone again.",
    strengths: [
      "You notice small shifts in closeness and are willing to repair.",
      "You take the bond seriously and show up when something feels off.",
      "You can name what you need once the moment feels safe enough.",
    ],
    stuckPoints: [
      "Waiting for a reply can take over the rest of your day.",
      "You may read silence as a verdict before you have facts.",
      "Reassurance can become the only thing that settles your body.",
    ],
    startingPoints: [
      "Name one need in plain language before checking the phone again.",
      "Ask one direct question instead of scanning for hidden meaning.",
      "Give the other person a time window to respond, then do one thing for yourself.",
    ],
  },
  avoidant: {
    eyebrow: "Your free attachment summary",
    title: "Avoidant",
    summary:
      "When a relationship speeds up, you often reach for space, tasks, or self-reliance. Distance can feel like the fastest way to get your mind back.",
    strength: "You can stay steady when emotions run high.",
    watchout: "People close to you may read your pause as a closed door.",
    nextStep: "Offer a return time when you step back, even if the talk waits.",
    strengths: [
      "You can stay steady when emotions run high.",
      "You protect your own pace instead of disappearing into someone else's mood.",
      "You often solve practical problems while others are still spinning.",
    ],
    stuckPoints: [
      "People close to you may read your pause as a closed door.",
      "You may leave the tender part of a conversation for later, then not return.",
      "Independence can become a wall when you actually still care.",
    ],
    startingPoints: [
      "Offer a return time when you step back, even if the talk waits.",
      "Share one feeling in a short sentence before changing the subject.",
      "Keep the connection visible while you take the space you need.",
    ],
  },
  secure: {
    eyebrow: "Your free attachment summary",
    title: "Secure",
    summary:
      "You can want closeness without treating every pause as danger. You tend to check in, give room, and come back to the conversation when it matters.",
    strength: "You hold both connection and your own pace.",
    watchout: "You may underestimate how much a clearer signal would help someone else.",
    nextStep: "Keep saying what you need while it still feels small.",
    strengths: [
      "You hold both connection and your own pace.",
      "You can check in without treating every pause as danger.",
      "You tend to come back to the conversation when it matters.",
    ],
    stuckPoints: [
      "You may underestimate how much a clearer signal would help someone else.",
      "You can stay so even that you miss another person's spike of fear.",
      "Being \"fine\" can become a reason not to ask for what you want.",
    ],
    startingPoints: [
      "Keep saying what you need while it still feels small.",
      "Ask the other person what would make this moment easier.",
      "Name the good pattern out loud so it is easier to repeat.",
    ],
  },
  fearful: {
    eyebrow: "Your free attachment summary",
    title: "Fearful-Avoidant",
    summary:
      "You may reach in and pull back in the same stretch of time. Closeness can feel like relief and risk at once, so your first move is often mixed.",
    strength: "You can sense both the need for contact and the need for safety.",
    watchout: "The mix of reaching and retreating can confuse you and the other person.",
    nextStep: "Pick one move—reach or rest—and finish it before switching.",
    strengths: [
      "You can sense both the need for contact and the need for safety.",
      "You notice mixed signals in yourself before they turn into a larger rupture.",
      "You have more than one way to come back after a hard moment.",
    ],
    stuckPoints: [
      "The mix of reaching and retreating can confuse you and the other person.",
      "Closeness can feel like relief and risk in the same hour.",
      "You may change course before either move has a chance to work.",
    ],
    startingPoints: [
      "Pick one move—reach or rest—and finish it before switching.",
      "Tell the other person you want both closeness and a little room.",
      "Write down what you need before you send the next message.",
    ],
  },
};

export function isAttachmentStyle(key: ResultProfile["key"] | string | undefined): key is AttachmentStyle {
  return key === "anxious" || key === "avoidant" || key === "secure" || key === "fearful";
}

export function styleFromOptionIndex(index: number): AttachmentStyle {
  return ATTACHMENT_STYLES[Math.max(0, Math.min(3, index))] ?? "secure";
}

function optionDimension(option: QuizQuestion["options"][number], index: number): { anxiety: number; avoidance: number } {
  if (isAttachmentStyle(option.styleKey)) {
    return {
      anxiety: option.styleKey === "anxious" || option.styleKey === "fearful" ? 2 : 0,
      avoidance: option.styleKey === "avoidant" || option.styleKey === "fearful" ? 2 : 0,
    };
  }
  if (option.readingFocus && THEME_DIMENSIONS[option.readingFocus]) {
    return THEME_DIMENSIONS[option.readingFocus];
  }
  const style = styleFromOptionIndex(index);
  return {
    anxiety: style === "anxious" || style === "fearful" ? 2 : 0,
    avoidance: style === "avoidant" || style === "fearful" ? 2 : 0,
  };
}

export function classifyAttachment(anxietyScore: number, avoidanceScore: number): AttachmentStyle {
  const highAnxiety = anxietyScore >= 45;
  const highAvoidance = avoidanceScore >= 45;
  if (highAnxiety && highAvoidance) return "fearful";
  if (highAnxiety) return "anxious";
  if (highAvoidance) return "avoidant";
  return "secure";
}

export function scoreAttachment(
  questions: QuizQuestion[],
  choices: Record<string, number>,
): { anxiety: number; avoidance: number; style: AttachmentStyle; answered: number } {
  let anxiety = 0;
  let avoidance = 0;
  let answered = 0;

  for (const question of questions) {
    const index = choices[question.id];
    if (!Number.isInteger(index) || !question.options[index]) continue;
    answered += 1;
    const points = optionDimension(question.options[index], index);
    anxiety += points.anxiety;
    avoidance += points.avoidance;
  }

  const max = Math.max(answered * 2, 1);
  const anxietyScore = Math.round((anxiety / max) * 100);
  const avoidanceScore = Math.round((avoidance / max) * 100);

  return {
    anxiety: anxietyScore,
    avoidance: avoidanceScore,
    style: classifyAttachment(anxietyScore, avoidanceScore),
    answered,
  };
}

export function buildAttachmentResult(
  questions: QuizQuestion[],
  choices: Record<string, number>,
): ResultProfile {
  const { anxiety, avoidance, style } = scoreAttachment(questions, choices);
  const profile = ATTACHMENT_RESULTS[style];
  return {
    key: style,
    ...profile,
    anxiety,
    avoidance,
  };
}

export function applyAttachmentStyle(
  reading: { result: ResultProfile; deepResult: { modules?: { title: string; explanation: string; reflection: string }[]; lens: { title: string; explanation: string; reflectionPrompt: string } } },
  questions: QuizQuestion[],
  choices: Record<string, number>,
) {
  const scored = scoreAttachment(questions, choices);
  const profile = ATTACHMENT_RESULTS[scored.style];
  const styleLabel = ATTACHMENT_STYLE_META[scored.style].label;
  const themeTitle = reading.result.themeTitle || reading.result.title;
  return {
    result: {
      ...profile,
      key: scored.style,
      title: styleLabel,
      themeTitle,
      summary: `Your image choices land closest to ${styleLabel}. ${reading.result.summary}`,
      anxiety: scored.anxiety,
      avoidance: scored.avoidance,
    } satisfies ResultProfile,
    deepResult: reading.deepResult,
  };
}

/** Recompute a style + chart for saved snapshots that only stored a poetic theme. */
export function resolveAttachmentScores(
  questions: QuizQuestion[],
  choices: Record<string, number>,
  existing?: Pick<ResultProfile, "key" | "anxiety" | "avoidance">,
): { anxiety: number; avoidance: number; style: AttachmentStyle } | null {
  if (
    isAttachmentStyle(existing?.key) &&
    typeof existing?.anxiety === "number" &&
    typeof existing?.avoidance === "number"
  ) {
    return { anxiety: existing.anxiety, avoidance: existing.avoidance, style: existing.key };
  }
  if (!questions.length) return null;
  const scored = scoreAttachment(questions, choices);
  return scored.answered ? scored : null;
}
