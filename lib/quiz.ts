export const TRAIT_KEYS = ["explorer", "connector", "architect", "creator"] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

export type QuizOption = {
  label: string;
  microcopy: string;
  scoreKey: TraitKey;
};

export type QuizQuestion = {
  id: string;
  kicker: string;
  prompt: string;
  atlasPath: string;
  position: number;
  active: boolean;
  options: QuizOption[];
};

export type ResultProfile = {
  key: TraitKey;
  eyebrow: string;
  title: string;
  summary: string;
  strength: string;
  watchout: string;
  nextStep: string;
};

export const defaultQuestions: QuizQuestion[] = [
  {
    id: "landscape",
    kicker: "Follow your first pull",
    prompt: "Where would you go to feel most like yourself?",
    atlasPath: "/quiz/landscapes.png",
    position: 1,
    active: true,
    options: [
      { label: "The forest", microcopy: "Quiet discovery", scoreKey: "connector" },
      { label: "The cliff", microcopy: "Open possibility", scoreKey: "explorer" },
      { label: "The desert", microcopy: "Clear perspective", scoreKey: "architect" },
      { label: "The meadow", microcopy: "Creative ease", scoreKey: "creator" },
    ],
  },
  {
    id: "door",
    kicker: "Trust the one you notice",
    prompt: "Which door would you open without hesitation?",
    atlasPath: "/quiz/doors.png",
    position: 2,
    active: true,
    options: [
      { label: "The ivy door", microcopy: "A hidden story", scoreKey: "connector" },
      { label: "The red door", microcopy: "A bold beginning", scoreKey: "explorer" },
      { label: "The cottage door", microcopy: "A place to belong", scoreKey: "architect" },
      { label: "The starlit door", microcopy: "A world to imagine", scoreKey: "creator" },
    ],
  },
  {
    id: "symbol",
    kicker: "No overthinking",
    prompt: "Which object feels as if it already belongs to you?",
    atlasPath: "/quiz/symbols.png",
    position: 3,
    active: true,
    options: [
      { label: "The compass", microcopy: "Direction", scoreKey: "explorer" },
      { label: "The prism", microcopy: "New angles", scoreKey: "creator" },
      { label: "The sprout", microcopy: "Steady growth", scoreKey: "connector" },
      { label: "The journal", microcopy: "Inner order", scoreKey: "architect" },
    ],
  },
  {
    id: "room",
    kicker: "Choose your natural rhythm",
    prompt: "Where would your mind finally exhale?",
    atlasPath: "/quiz/rooms.png",
    position: 4,
    active: true,
    options: [
      { label: "The library", microcopy: "Depth and focus", scoreKey: "architect" },
      { label: "The green studio", microcopy: "Make and explore", scoreKey: "creator" },
      { label: "The rain room", microcopy: "Feel and restore", scoreKey: "connector" },
      { label: "The candlelit nook", microcopy: "Gather and act", scoreKey: "explorer" },
    ],
  },
];

export const resultProfiles: Record<TraitKey, ResultProfile> = {
  explorer: {
    key: "explorer",
    eyebrow: "Your instinctive style",
    title: "The Quiet Explorer",
    summary:
      "You come alive around possibility. You do not need constant noise or attention—you need a horizon, a choice, and enough freedom to move toward what feels alive.",
    strength: "You spot openings before other people see them and turn uncertainty into momentum.",
    watchout: "When every path stays open, commitment can feel more limiting than it really is.",
    nextStep: "Choose one small experiment this week and give it a clear finish line.",
  },
  connector: {
    key: "connector",
    eyebrow: "Your instinctive style",
    title: "The Deep Connector",
    summary:
      "You read the emotional weather in a room almost instantly. Meaning, trust, and genuine reciprocity matter more to you than surface-level approval.",
    strength: "You create the safety that helps people become more honest, creative, and brave.",
    watchout: "You can absorb other people’s needs so fully that your own signal becomes faint.",
    nextStep: "Before saying yes, name what you need in the situation too.",
  },
  architect: {
    key: "architect",
    eyebrow: "Your instinctive style",
    title: "The Inner Architect",
    summary:
      "Your mind naturally looks for patterns, structure, and what will still make sense tomorrow. Calm comes from clarity—not control for its own sake.",
    strength: "You turn scattered ideas into durable systems and dependable decisions.",
    watchout: "Waiting for a perfect map can delay the useful information that only action provides.",
    nextStep: "Define the smallest version that would teach you something real, then ship it.",
  },
  creator: {
    key: "creator",
    eyebrow: "Your instinctive style",
    title: "The Pattern Maker",
    summary:
      "You notice unusual connections and imagine what could exist between the obvious options. Expression is not decoration for you—it is how you understand experience.",
    strength: "You give fresh form to feelings and ideas that other people struggle to articulate.",
    watchout: "Too much inspiration without a container can leave your best ideas unfinished.",
    nextStep: "Protect one recurring block of time for making, with no pressure to share it yet.",
  },
};

export function calculateResult(
  answers: Record<string, TraitKey>,
): ResultProfile {
  const scores: Record<TraitKey, number> = {
    explorer: 0,
    connector: 0,
    architect: 0,
    creator: 0,
  };

  Object.values(answers).forEach((key) => {
    if (key in scores) scores[key] += 1;
  });

  const winner = TRAIT_KEYS.reduce((best, key) =>
    scores[key] > scores[best] ? key : best,
  );
  return resultProfiles[winner];
}
