import { getOptionInsight } from "@/lib/choice-insights";
import { questionBank } from "@/lib/quiz-question-bank";
import { TRAIT_KEYS, type QuizQuestion, type QuizTest } from "@/lib/quiz";

export const defaultTests: QuizTest[] = [
  {
    id: "attachment-style",
    title: "How You Attach in Love",
    kicker: "Most popular · Relationships",
    description: "See what you instinctively reach for when closeness feels uncertain.",
    coverAtlasPath: "/quiz/doors.png",
    accent: "#9b4f5e",
    position: 1,
    active: true,
    featured: true,
    reportPriceCents: 499,
  },
  {
    id: "emotional-needs",
    title: "When They Pull Away",
    kicker: "Relationships · Emotional need",
    description: "See what you are actually starving for when the bond goes a little cold.",
    coverAtlasPath: "/quiz/rooms.png",
    accent: "#2f6653",
    position: 2,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "conflict-style",
    title: "After You Fight",
    kicker: "Relationships · Communication",
    description: "Find the pattern you reach for first when a fight with them starts.",
    coverAtlasPath: "/quiz/landscapes.png",
    accent: "#b46e43",
    position: 3,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "social-energy",
    title: "Love or a Spiral",
    kicker: "Most shared · Obsession",
    description: "See whether this pull is ordinary liking, or a loop you cannot put down.",
    coverAtlasPath: "/quiz/rooms.png",
    accent: "#6c5a91",
    position: 4,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "love-language",
    title: "How You Feel Most Loved",
    kicker: "Shareable · Love",
    description: "Reveal the kind of care from them that actually lands.",
    coverAtlasPath: "/quiz/symbols.png",
    accent: "#b35c72",
    position: 5,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "stress-reset",
    title: "When Love Hits Your Body",
    kicker: "Wellbeing · Relationships",
    description: "See what your body asks for first after a weird text, a cool reply, or silence.",
    coverAtlasPath: "/quiz/landscapes.png",
    accent: "#39747b",
    position: 6,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "boundary-style",
    title: "Your Boundary in Love",
    kicker: "Self-respect · Relationships",
    description: "Discover how you protect your time, privacy, and access when they want more.",
    coverAtlasPath: "/quiz/doors.png",
    accent: "#74533b",
    position: 7,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "hidden-strength",
    title: "The Strength You Hide in Love",
    kicker: "Positive insight · Relationships",
    description: "Find the ability you use in love so naturally that you may not count it.",
    coverAtlasPath: "/quiz/symbols.png",
    accent: "#4d628b",
    position: 8,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
];

const optionDetails: Record<(typeof TRAIT_KEYS)[number], string> = {
  explorer: "Move toward them",
  connector: "Soften the bond",
  architect: "Make it clear",
  creator: "Wait for the feeling",
};

export const defaultQuestions: QuizQuestion[] = defaultTests.flatMap((test) =>
  (questionBank[test.id] ?? []).map((question, questionIndex) => {
    const atlasPath = question.atlas ?? "";
    return {
      id: `${test.id}-${questionIndex + 1}`,
      testId: test.id,
      kicker: question.kicker,
      prompt: question.prompt,
      atlasPath,
      position: questionIndex + 1,
      active: true,
      options: question.options.map((label, optionIndex) => {
        const scoreKey = TRAIT_KEYS[optionIndex];
        return {
          label,
          microcopy: optionDetails[scoreKey],
          ...getOptionInsight(test.id, atlasPath, scoreKey),
        };
      }),
    };
  }),
);
