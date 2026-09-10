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
    title: "Your Hidden Emotional Need",
    kicker: "Fast insight · Inner world",
    description: "Discover what your mind quietly asks for when life gets noisy.",
    coverAtlasPath: "/quiz/rooms.png",
    accent: "#2f6653",
    position: 2,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "conflict-style",
    title: "Your Conflict Instinct",
    kicker: "Relationships · Communication",
    description: "Find the pattern you reach for first when tension enters the room.",
    coverAtlasPath: "/quiz/landscapes.png",
    accent: "#b46e43",
    position: 3,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "social-energy",
    title: "Your Social Battery Type",
    kicker: "Highly relatable · Social life",
    description: "Learn what actually gives you energy around other people—and what drains it.",
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
    kicker: "Shareable · Love & friendship",
    description: "Reveal the kind of care that lands most deeply for you.",
    coverAtlasPath: "/quiz/symbols.png",
    accent: "#b35c72",
    position: 5,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "stress-reset",
    title: "How You Reset Under Stress",
    kicker: "Wellbeing · 5 minutes",
    description: "See which kind of reset your mind and body ask for first.",
    coverAtlasPath: "/quiz/landscapes.png",
    accent: "#39747b",
    position: 6,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "boundary-style",
    title: "Your Relationship Boundary Style",
    kicker: "Self-respect · Relationships",
    description: "Discover how you protect your time, privacy, and emotional space.",
    coverAtlasPath: "/quiz/doors.png",
    accent: "#74533b",
    position: 7,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
  {
    id: "hidden-strength",
    title: "The Strength People Miss in You",
    kicker: "Positive insight · Personality",
    description: "Find the ability you use so naturally that you may underestimate it.",
    coverAtlasPath: "/quiz/symbols.png",
    accent: "#4d628b",
    position: 8,
    active: true,
    featured: false,
    reportPriceCents: 499,
  },
];

const optionDetails: Record<(typeof TRAIT_KEYS)[number], string> = {
  explorer: "Move toward it",
  connector: "Reach for connection",
  architect: "Create some clarity",
  creator: "Follow the feeling",
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
