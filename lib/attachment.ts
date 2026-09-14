import type { QuizQuestion, ResultProfile } from "./quiz";

export const ATTACHMENT_STYLES = ["anxious", "avoidant", "secure", "fearful"] as const;

export type AttachmentStyle = (typeof ATTACHMENT_STYLES)[number];

export const STYLE_DIMENSIONS: Record<AttachmentStyle, { anxiety: number; avoidance: number }> = {
  anxious: { anxiety: 2, avoidance: 0 },
  avoidant: { anxiety: 0, avoidance: 2 },
  secure: { anxiety: 0, avoidance: 0 },
  fearful: { anxiety: 1, avoidance: 1 },
};

export const ATTACHMENT_STYLE_META: Record<
  AttachmentStyle,
  { label: string; shortLabel: string; accent: string; blurb: string }
> = {
  anxious: {
    label: "Anxious-Preoccupied",
    shortLabel: "Preoccupied",
    accent: "#9b4f5e",
    blurb: "You move toward closeness when something feels uncertain.",
  },
  avoidant: {
    label: "Dismissing-Avoidant",
    shortLabel: "Dismissing",
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

export const SCORE_SCALE = 7;

export type IntensityLabel = "Low" | "Medium" | "High" | "Very High";
export type WorthLevel = "Low" | "Medium" | "High";

export type DimensionScore = {
  anxiety: number;
  avoidance: number;
  anxietySeven: number;
  avoidanceSeven: number;
  anxietyLabel: IntensityLabel;
  avoidanceLabel: IntensityLabel;
};

export function scoreOnSeven(percent: number): number {
  const value = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  return Math.round((value / 100) * SCORE_SCALE * 10) / 10;
}

export function intensityLabel(percent: number): IntensityLabel {
  if (percent < 30) return "Low";
  if (percent < 50) return "Medium";
  if (percent < 70) return "High";
  return "Very High";
}

export function worthLevel(percent: number): WorthLevel {
  if (percent < 40) return "Low";
  if (percent < 70) return "Medium";
  return "High";
}

export function dimensionScore(anxiety: number, avoidance: number): DimensionScore {
  return {
    anxiety,
    avoidance,
    anxietySeven: scoreOnSeven(anxiety),
    avoidanceSeven: scoreOnSeven(avoidance),
    anxietyLabel: intensityLabel(anxiety),
    avoidanceLabel: intensityLabel(avoidance),
  };
}

export const ATTACHMENT_OVERVIEWS: Record<AttachmentStyle, { dating: string[]; withSelf: string[]; underStress: string[] }> = {
  anxious: {
    dating: [
      "When a reply is late or cooler than usual, you tend to move closer.",
      "You look for a label, a plan, or a sign that you still matter.",
      "You may replay old chats to find what you did wrong.",
    ],
    withSelf: [
      "Uncertainty in the bond can take over the rest of your day.",
      "You may need proof before you can believe you are still chosen.",
      "A small mistake can feel larger than the moment that caused it.",
    ],
    underStress: [
      "You tend to chase: text, call, or press until it feels resolved.",
      "Silence can feel louder than the facts you actually have.",
      "Comfort now can matter more than giving the moment room.",
    ],
  },
  avoidant: {
    dating: [
      "When closeness speeds up, you tend to protect space.",
      "Labels and big future talk can feel like a trap.",
      "You may match a cooler tone and handle hard days alone.",
    ],
    withSelf: [
      "Self-reliance can feel safer than being needed.",
      "Being loved can start to feel like a hassle when it asks too much.",
      "You may tell yourself you do not care, then go quiet.",
    ],
    underStress: [
      "You tend to withdraw: phone face-down, leave the room, go silent.",
      "You keep working or training instead of opening the feeling.",
      "People close to you may read your pause as a closed door.",
    ],
  },
  secure: {
    dating: [
      "When the tone shifts, you tend to notice it, stay steady, and ask once.",
      "You want clarity and pick a calm time to talk.",
      "You can enjoy more affection without dropping your own pace.",
    ],
    withSelf: [
      "You mostly believe you are worthy even when things wobble.",
      "You can take a compliment in and own a small mistake once.",
      "You make room for both contact and a few hours apart.",
    ],
    underStress: [
      "You pause with a return time, then come back to the talk.",
      "You name what is still missing once and watch actions.",
      "You share the headline of a hard day and what would help.",
    ],
  },
  fearful: {
    dating: [
      "You tend to want the label and also fear feeling trapped.",
      "You may melt in tonight and go quiet or pick a fight tomorrow.",
      "Double-texting, then going cold, can happen in the same evening.",
    ],
    withSelf: [
      "You can feel good, then later feel undeserving.",
      "Worthiness may swing: sometimes sure, sometimes sure you will ruin it.",
      "You may look fine outwardly and spiral privately later.",
    ],
    underStress: [
      "You push away, then panic they will not come back.",
      "You start to open, then shut down mid-story.",
      "The mix of reaching and retreating can confuse you and the other person.",
    ],
  },
};

export const ATTACHMENT_LOOPS: Record<AttachmentStyle, { name: string; kind: "chase" | "withdraw" | "push-pull" | "notice-name-repair"; steps: string[] }> = {
  anxious: {
    name: "Chase",
    kind: "chase",
    steps: ["A pause or cooler tone lands", "You scan and reach", "A reply brings brief relief", "The next quiet restarts the chase"],
  },
  avoidant: {
    name: "Withdraw",
    kind: "withdraw",
    steps: ["Closeness or emotion rises", "Your body wants out", "You take distance or a task", "Calm returns — until closeness asks again"],
  },
  fearful: {
    name: "Push-pull",
    kind: "push-pull",
    steps: ["You reach for contact", "It suddenly feels too close", "You pull away", "Fear of loss sends you back"],
  },
  secure: {
    name: "Notice, name, repair",
    kind: "notice-name-repair",
    steps: ["You notice the shift", "You name it once", "You take the space or contact you need", "You return and repair"],
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
    title: "Anxious-Preoccupied",
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
    title: "Dismissing-Avoidant",
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

export function optionStyle(option: QuizQuestion["options"][number], index: number): AttachmentStyle {
  return isAttachmentStyle(option.styleKey) ? option.styleKey : styleFromOptionIndex(index);
}

function optionDimension(option: QuizQuestion["options"][number], index: number): { anxiety: number; avoidance: number } {
  if (isAttachmentStyle(option.styleKey)) {
    return STYLE_DIMENSIONS[option.styleKey];
  }
  if (option.readingFocus && THEME_DIMENSIONS[option.readingFocus]) {
    return THEME_DIMENSIONS[option.readingFocus];
  }
  return STYLE_DIMENSIONS[styleFromOptionIndex(index)];
}

/** Scores at or above this count as “high” on the Bartholomew grid. */
export const QUADRANT_THRESHOLD = 45;

/**
 * Stretch a 0–100 dimension onto the colored 50/50 board so the classification
 * cutoff (45) sits on the visual midline, not 5 points into the “low” half.
 */
export function chartAxisPercent(score: number, threshold = QUADRANT_THRESHOLD): number {
  const value = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  if (value < threshold) return (value / threshold) * 50;
  if (value === threshold) return 52;
  return 50 + ((value - threshold) / (100 - threshold)) * 50;
}

export function attachmentPlotPosition(
  anxiety: number,
  avoidance: number,
): { leftPercent: number; topPercent: number } {
  return {
    leftPercent: chartAxisPercent(avoidance),
    topPercent: 100 - chartAxisPercent(anxiety),
  };
}

export function plotVisualQuadrant(anxiety: number, avoidance: number): AttachmentStyle {
  const { leftPercent, topPercent } = attachmentPlotPosition(anxiety, avoidance);
  const highAnxiety = topPercent < 50;
  const highAvoidance = leftPercent > 50;
  if (highAnxiety && highAvoidance) return "fearful";
  if (highAnxiety) return "anxious";
  if (highAvoidance) return "avoidant";
  return "secure";
}

export function classifyAttachment(anxietyScore: number, avoidanceScore: number): AttachmentStyle {
  const highAnxiety = anxietyScore >= QUADRANT_THRESHOLD;
  const highAvoidance = avoidanceScore >= QUADRANT_THRESHOLD;
  if (highAnxiety && highAvoidance) return "fearful";
  if (highAnxiety) return "anxious";
  if (highAvoidance) return "avoidant";
  return "secure";
}

export function scoreAttachmentSubset(
  questions: QuizQuestion[],
  choices: Record<string, number>,
  kicker: string,
): { anxiety: number; avoidance: number; style: AttachmentStyle; answered: number } {
  return scoreAttachment(
    questions.filter((question) => question.kicker === kicker),
    choices,
  );
}

export function selfWorthSnapshot(
  questions: QuizQuestion[],
  choices: Record<string, number>,
): { percent: number; level: WorthLevel } {
  const scored = scoreAttachmentSubset(questions, choices, "Self-esteem");
  const source = scored.answered ? scored : scoreAttachment(questions, choices);
  const percent = Math.max(0, Math.min(100, Math.round(100 - source.anxiety * 0.65 - source.avoidance * 0.35)));
  return { percent, level: worthLevel(percent) };
}

export function scoreAttachment(
  questions: QuizQuestion[],
  choices: Record<string, number>,
): {
  anxiety: number;
  avoidance: number;
  style: AttachmentStyle;
  answered: number;
  secondary?: AttachmentStyle;
  dualHigh: boolean;
  tally: Record<AttachmentStyle, number>;
} {
  let anxiety = 0;
  let avoidance = 0;
  let answered = 0;
  const tally: Record<AttachmentStyle, number> = { anxious: 0, avoidant: 0, secure: 0, fearful: 0 };

  for (const question of questions) {
    const index = choices[question.id];
    if (!Number.isInteger(index) || !question.options[index]) continue;
    answered += 1;
    const option = question.options[index];
    const style = optionStyle(option, index);
    tally[style] += 2;
    const points = optionDimension(option, index);
    anxiety += points.anxiety;
    avoidance += points.avoidance;
  }

  const max = Math.max(answered * 2, 1);
  const anxietyScore = Math.round((anxiety / max) * 100);
  const avoidanceScore = Math.round((avoidance / max) * 100);
  const ranked = ATTACHMENT_STYLES
    .map((key) => ({ key, count: tally[key] }))
    .sort((a, b) => b.count - a.count || ATTACHMENT_STYLES.indexOf(a.key) - ATTACHMENT_STYLES.indexOf(b.key));
  const top = ranked[0]?.count ?? 0;
  const tied = ranked.filter((item) => item.count === top && top > 0);
  const dualHigh = tied.length > 1;
  const style = tied.length === 1 ? tied[0].key : classifyAttachment(anxietyScore, avoidanceScore);
  const secondary = (dualHigh ? tied.find((item) => item.key !== style) : ranked[1]?.count ? ranked[1] : undefined)?.key;

  return {
    anxiety: anxietyScore,
    avoidance: avoidanceScore,
    style,
    answered,
    ...(secondary ? { secondary } : {}),
    dualHigh,
    tally,
  };
}

export function buildAttachmentResult(
  questions: QuizQuestion[],
  choices: Record<string, number>,
): ResultProfile {
  const { anxiety, avoidance, style, secondary, dualHigh } = scoreAttachment(questions, choices);
  const profile = ATTACHMENT_RESULTS[style];
  return {
    key: style,
    ...profile,
    themeTitle: dualHigh && secondary
      ? `${ATTACHMENT_STYLE_META[style].label} and ${ATTACHMENT_STYLE_META[secondary].label} both scored highest.`
      : ATTACHMENT_STYLE_META[style].blurb,
    anxiety,
    avoidance,
    ...(secondary ? { secondaryKey: secondary, dualHigh } : {}),
  };
}

export function applyAttachmentStyle(
  _reading: { result: ResultProfile; deepResult: { modules?: { title: string; explanation: string; reflection: string }[]; lens: { title: string; explanation: string; reflectionPrompt: string } } },
  questions: QuizQuestion[],
  choices: Record<string, number>,
) {
  const scored = scoreAttachment(questions, choices);
  const profile = ATTACHMENT_RESULTS[scored.style];
  const styleLabel = ATTACHMENT_STYLE_META[scored.style].label;
  return {
    result: {
      ...profile,
      key: scored.style,
      title: styleLabel,
      themeTitle: ATTACHMENT_STYLE_META[scored.style].blurb,
      summary: `Your choices land closest to ${styleLabel}. ${profile.summary}`,
      anxiety: scored.anxiety,
      avoidance: scored.avoidance,
    } satisfies ResultProfile,
    deepResult: _reading.deepResult,
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
