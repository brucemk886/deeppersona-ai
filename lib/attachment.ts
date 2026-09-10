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
    label: "Fearful-avoidant",
    shortLabel: "Fearful-avoidant",
    accent: "#6c5a91",
    blurb: "You want closeness and also need a way out when it feels like too much.",
  },
};

const ATTACHMENT_RESULTS: Record<AttachmentStyle, Omit<ResultProfile, "key">> = {
  anxious: {
    eyebrow: "Your free attachment read",
    title: "Anxious",
    summary:
      "When a bond feels unclear, your attention often goes to the relationship first. You look for a signal that you still matter, and silence can feel louder than it is.",
    strength: "You notice small shifts in closeness and are willing to repair.",
    watchout: "Waiting for reassurance can take over the rest of your day.",
    nextStep: "Name one need in plain language before checking the phone again.",
  },
  avoidant: {
    eyebrow: "Your free attachment read",
    title: "Avoidant",
    summary:
      "When a relationship speeds up, you often reach for space, tasks, or self-reliance. Distance can feel like the fastest way to get your mind back.",
    strength: "You can stay steady when emotions run high.",
    watchout: "People close to you may read your pause as a closed door.",
    nextStep: "Offer a return time when you step back, even if the talk waits.",
  },
  secure: {
    eyebrow: "Your free attachment read",
    title: "Secure",
    summary:
      "You can want closeness without treating every pause as danger. You tend to check in, give room, and come back to the conversation when it matters.",
    strength: "You hold both connection and your own pace.",
    watchout: "You may underestimate how much a clearer signal would help someone else.",
    nextStep: "Keep saying what you need while it still feels small.",
  },
  fearful: {
    eyebrow: "Your free attachment read",
    title: "Fearful-avoidant",
    summary:
      "You may reach in and pull back in the same stretch of time. Closeness can feel like relief and risk at once, so your first move is often mixed.",
    strength: "You can sense both the need for contact and the need for safety.",
    watchout: "The mix of reaching and retreating can confuse you and the other person.",
    nextStep: "Pick one move—reach or rest—and finish it before switching.",
  },
};

export function styleFromOptionIndex(index: number): AttachmentStyle {
  return ATTACHMENT_STYLES[Math.max(0, Math.min(3, index))] ?? "secure";
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
    const style = styleFromOptionIndex(index);
    if (style === "anxious") anxiety += 2;
    if (style === "avoidant") avoidance += 2;
    if (style === "fearful") {
      anxiety += 2;
      avoidance += 2;
    }
  }

  const max = Math.max(answered * 2, 1);
  const anxietyScore = Math.round((anxiety / max) * 100);
  const avoidanceScore = Math.round((avoidance / max) * 100);
  const highAnxiety = anxietyScore >= 45;
  const highAvoidance = avoidanceScore >= 45;
  const style: AttachmentStyle = highAnxiety
    ? highAvoidance
      ? "fearful"
      : "anxious"
    : highAvoidance
      ? "avoidant"
      : "secure";

  return { anxiety: anxietyScore, avoidance: avoidanceScore, style, answered };
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
