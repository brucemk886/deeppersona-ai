import { getOptionInsight } from "@/lib/choice-insights";
import { TRAIT_KEYS, type TraitKey, type QuizQuestion, type QuizTest, type ResultProfile } from "@/lib/quiz";

const profile = (
  key: TraitKey,
  title: string,
  summary: string,
  strength: string,
  watchout: string,
  nextStep: string,
): ResultProfile => ({
  key,
  eyebrow: "Your reflection profile",
  title,
  summary,
  strength,
  watchout,
  nextStep,
});

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
    kicker: "Wellbeing · 2 minutes",
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

type CompactQuestion = {
  kicker: string;
  prompt: string;
  options: [string, string, string, string];
};

function atlasPathFor(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("room")) return "/quiz/rooms.png";
  if (normalized.includes("door") || normalized.includes("welcome")) return "/quiz/doors.png";
  if (normalized.includes("object") || normalized.includes("tool")) return "/quiz/symbols.png";
  return "/quiz/landscapes.png";
}

const optionDetails: Record<TraitKey, string> = {
  explorer: "Move toward it",
  connector: "Reach for connection",
  architect: "Create some clarity",
  creator: "Follow the feeling",
};

const questionSets: Record<string, CompactQuestion[]> = {
  "attachment-style": [
    { kicker: "Trust your first response", prompt: "They suddenly go quiet. Which door feels most like your next move?", options: ["Ask what changed", "Send a warm check-in", "Give them space", "Wait, then reach out"] },
    { kicker: "Picture closeness", prompt: "Which room feels safest to share with someone you love?", options: ["The open studio", "The candlelit table", "The private library", "The rain-lit retreat"] },
    { kicker: "Notice the pull", prompt: "Which path best matches the pace of love you trust?", options: ["The bright cliff path", "The soft meadow", "The steady forest trail", "The moonlit desert"] },
    { kicker: "Choose without explaining", prompt: "Which object would you keep near when a relationship feels uncertain?", options: ["The compass", "The growing sprout", "The journal", "The prism"] },
  ],
  "emotional-needs": [
    { kicker: "Let your mind exhale", prompt: "Which room would give you what you need most tonight?", options: ["Space to create", "A place to be held", "Quiet and order", "A world of your own"] },
    { kicker: "Follow the invitation", prompt: "Which door feels like relief rather than escape?", options: ["The open red door", "The warm cottage", "The hidden ivy door", "The starlit doorway"] },
    { kicker: "First feeling only", prompt: "Which landscape gives you the deepest sense of enough?", options: ["The open coast", "The flower meadow", "The grounded forest", "The moonlit desert"] },
    { kicker: "Choose what calls you", prompt: "Which object feels like the missing piece today?", options: ["A compass", "A living sprout", "A blank journal", "A prism"] },
  ],
  "conflict-style": [
    { kicker: "When tension rises", prompt: "Which path would you take after a difficult conversation?", options: ["The exposed cliff", "The gentle meadow", "The quiet forest", "The wide desert"] },
    { kicker: "Imagine the next step", prompt: "Which door matches how you return after an argument?", options: ["Open it now", "Bring warmth first", "Knock when ready", "Wait for the right moment"] },
    { kicker: "No perfect answer", prompt: "Which room feels best for resolving something important?", options: ["The open studio", "The shared table", "The private library", "The quiet rain room"] },
    { kicker: "Pick your instinct", prompt: "Which object would guide you through disagreement?", options: ["The compass", "The sprout", "The journal", "The prism"] },
  ],
  "social-energy": [
    { kicker: "After a long week", prompt: "Which room would restore your social battery?", options: ["The creative studio", "The intimate table", "The quiet library", "The rain room"] },
    { kicker: "Choose your weekend", prompt: "Which landscape matches the social plan you would actually enjoy?", options: ["A coastal adventure", "A picnic meadow", "A familiar forest walk", "A solo moonlit drive"] },
    { kicker: "A new invitation arrives", prompt: "Which door matches your first reaction?", options: ["Step straight in", "Ask who will be there", "Look before entering", "Choose another night"] },
    { kicker: "What do you bring?", prompt: "Which object represents your energy in a group?", options: ["The compass", "The sprout", "The journal", "The prism"] },
  ],
  "love-language": [
    { kicker: "What lands deepest?", prompt: "Which object would feel most meaningful from someone you love?", options: ["A compass for a trip", "A growing plant", "A letter in a journal", "A prism chosen for you"] },
    { kicker: "Picture being cared for", prompt: "Which room holds your favorite kind of closeness?", options: ["Making something together", "A dinner for two", "A task quietly handled", "A beautiful private ritual"] },
    { kicker: "Choose the memory", prompt: "Which landscape would make you feel most connected?", options: ["A shared adventure", "A soft place to talk", "A dependable familiar path", "A magical surprise"] },
    { kicker: "One door opens", prompt: "Which welcome would make you feel most loved?", options: ["Come, let's go", "I've missed you", "I took care of it", "I made this for us"] },
  ],
  "stress-reset": [
    { kicker: "Your system knows", prompt: "Which landscape would lower your stress fastest?", options: ["A brisk coastal walk", "A gentle meadow", "A steady forest path", "A silent moonlit desert"] },
    { kicker: "Imagine one free hour", prompt: "Which room would you choose to reset?", options: ["The active studio", "The warm table", "The ordered library", "The quiet rain room"] },
    { kicker: "Choose the first tool", prompt: "Which object feels most useful when everything is too much?", options: ["The compass", "The living sprout", "The blank journal", "The light-catching prism"] },
    { kicker: "Step out of the noise", prompt: "Which door feels like the reset you need?", options: ["The bold open door", "The warm cottage", "The private ivy door", "The starlit doorway"] },
  ],
  "boundary-style": [
    { kicker: "Protect your energy", prompt: "Which door best represents a healthy boundary to you?", options: ["Clearly open or closed", "Warm but intentional", "Private and protected", "Open when it feels right"] },
    { kicker: "Your time is yours", prompt: "Which room would you keep interruption-free?", options: ["The working studio", "The intimate table", "The private library", "The quiet retreat"] },
    { kicker: "Notice your limit", prompt: "Which landscape feels like the right amount of distance?", options: ["A clear horizon", "A nearby meadow", "A sheltered forest", "A wide open desert"] },
    { kicker: "Choose your signal", prompt: "Which object best represents how you say no?", options: ["The compass", "The sprout", "The written page", "The prism"] },
  ],
  "hidden-strength": [
    { kicker: "What feels natural?", prompt: "Which object seems most like the way your mind works?", options: ["The compass", "The sprout", "The journal", "The prism"] },
    { kicker: "Follow your capability", prompt: "Which door would you be most likely to open first?", options: ["The bold red door", "The welcoming cottage", "The storied ivy door", "The impossible starlit door"] },
    { kicker: "Choose your element", prompt: "Which landscape reflects the strength you bring to others?", options: ["The daring coast", "The generous meadow", "The grounded forest", "The visionary desert"] },
    { kicker: "Where do you come alive?", prompt: "Which room makes your best qualities easiest to access?", options: ["The active studio", "The gathering table", "The thoughtful library", "The imaginative rain room"] },
  ],
};

export const defaultQuestions: QuizQuestion[] = defaultTests.flatMap((test) =>
  (questionSets[test.id] ?? []).map((question, questionIndex) => {
    const atlasPath = atlasPathFor(question.prompt);
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



