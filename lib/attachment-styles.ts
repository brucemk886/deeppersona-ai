export const ATTACHMENT_KEYS = ["secure", "anxious", "avoidant", "fearful"] as const;

export type AttachmentKey = (typeof ATTACHMENT_KEYS)[number];

export const PUBLIC_TEST_ID = "attachment-style";

export const LANDING_STYLES: { key: AttachmentKey; label: string; atlasIndex: number }[] = [
  { key: "secure", label: "Secure", atlasIndex: 0 },
  { key: "anxious", label: "Anxious", atlasIndex: 1 },
  { key: "avoidant", label: "Avoidant", atlasIndex: 2 },
  { key: "fearful", label: "Fearful", atlasIndex: 3 },
];

type AxisVector = { anxiety: number; avoidance: number };

const OPTION_VECTORS: AxisVector[] = [
  { anxiety: 2, avoidance: -1 },
  { anxiety: 1, avoidance: -2 },
  { anxiety: -1, avoidance: 2 },
  { anxiety: 1, avoidance: 1 },
];

export type AttachmentCopy = {
  title: string;
  summary: string;
  coreDrive: string;
  inRelationships: string;
  underPressure: string;
  trigger: string;
  superpower: string;
};

export const ATTACHMENT_COPY: Record<AttachmentKey, AttachmentCopy> = {
  secure: {
    title: "Secure",
    summary: "You can move toward them and also give space. Closeness does not have to cost your footing, and a pause does not have to become a story.",
    coreDrive: "You restore safety by staying in contact with both the bond and yourself.",
    inRelationships: "Partners often experience you as clear and warm. You can name a need without turning it into an emergency.",
    underPressure: "A long silence still stings, but you are more likely to ask once and wait than to chase or disappear.",
    trigger: "Mixed signals that never resolve, or a partner who punishes you for having a need.",
    superpower: "You can repair without losing the plot: one honest sentence, then room to come back.",
  },
  anxious: {
    title: "Anxious",
    summary: "When closeness feels uncertain, you reach. A reply, a warm signal, or a named next step is how your body looks for safety.",
    coreDrive: "You restore safety by making contact. Silence feels harder than an imperfect conversation.",
    inRelationships: "Partners may experience you as devoted and engaged, and sometimes as needing an answer before they have found their words.",
    underPressure: "If they stay quiet, you may send more care, more questions, or a warmer check-in than the moment can hold.",
    trigger: "Unanswered messages, a cooler tone, or a sudden change in how available they feel.",
    superpower: "You notice distance early and can start repair before a small silence becomes a rupture.",
  },
  avoidant: {
    title: "Avoidant",
    summary: "When closeness feels uncertain, you protect space. Distance is manageable when you still have a self and a clear edge.",
    coreDrive: "You restore safety through room, time, and a version of the situation you can think through.",
    inRelationships: "Partners may experience you as steady and self-contained, and sometimes as hard to reach while you sort the feeling privately.",
    underPressure: "If someone rushes you, you may close further and wait for the interaction to have a workable shape.",
    trigger: "Emotional flooding, vague plans, or being asked to talk before you are ready.",
    superpower: "You can turn a messy moment into something both people can actually follow.",
  },
  fearful: {
    title: "Fearful-avoidant",
    summary: "You want them close and you also do not want to get hurt. The same silence can make you reach, freeze, reread, and pull away.",
    coreDrive: "You restore safety only when the moment feels emotionally true and not dangerous.",
    inRelationships: "Partners may feel the intensity of how much you care, and the confusion of not knowing which version of you will arrive.",
    underPressure: "Mixed signals can hold you in place. You may write the message, delete it, and live in the story of what it meant.",
    trigger: "A warm night followed by a flat morning, or pressure to decide while your body is still braced.",
    superpower: "You can name the push-pull itself — the part most people act out and never say.",
  },
};

export function scoreAttachment(choiceIndexes: number[]) {
  let anxiety = 0;
  let avoidance = 0;
  for (const index of choiceIndexes) {
    const vector = OPTION_VECTORS[index] ?? OPTION_VECTORS[0];
    anxiety += vector.anxiety;
    avoidance += vector.avoidance;
  }
  const answered = choiceIndexes.length;
  const max = Math.max(1, answered * 2);
  const anxietyScore = roundAxis(((anxiety + max) / (2 * max)) * 10);
  const avoidanceScore = roundAxis(((avoidance + max) / (2 * max)) * 10);
  const anxietyNorm = anxiety / max;
  const avoidanceNorm = avoidance / max;
  const winner = classifyAttachment(anxietyNorm, avoidanceNorm);

  return {
    anxiety,
    avoidance,
    anxietyScore,
    avoidanceScore,
    winner,
    answered,
    votes: {
      secure: winner === "secure" ? answered : 0,
      anxious: winner === "anxious" ? answered : 0,
      avoidant: winner === "avoidant" ? answered : 0,
      fearful: winner === "fearful" ? answered : 0,
    },
  };
}

function classifyAttachment(anxietyNorm: number, avoidanceNorm: number): AttachmentKey {
  const center = Math.abs(anxietyNorm) < 0.22 && Math.abs(avoidanceNorm) < 0.22;
  if (center) return "secure";
  if (anxietyNorm >= 0.18 && avoidanceNorm >= 0.18) return "fearful";
  if (anxietyNorm >= avoidanceNorm) return "anxious";
  return "avoidant";
}

function roundAxis(value: number) {
  return Math.round(Math.min(10, Math.max(0, value)) * 10) / 10;
}
