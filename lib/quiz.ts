export const TRAIT_KEYS = ["explorer", "connector", "architect", "creator"] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

export type QuizOption = {
  label: string;
  microcopy: string;
  scoreKey: TraitKey;
};

export type QuizQuestion = {
  id: string;
  testId: string;
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

export type QuizTest = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  coverAtlasPath: string;
  accent: string;
  position: number;
  active: boolean;
  featured: boolean;
  results: Record<TraitKey, ResultProfile>;
  questionCount?: number;
};

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
    results: {
      explorer: profile("explorer", "The Steady Reconnector", "You value closeness without losing your center. When something feels off, you prefer a clear signal and an honest path back to connection.", "You can name what you need and stay open to the other person's reality.", "Your calm can sometimes hide needs you assume should be obvious.", "Ask for one specific form of connection instead of waiting to be read."),
      connector: profile("connector", "The Reassurance Seeker", "Connection matters deeply to you, so distance can feel louder than it looks. You notice small changes quickly and move toward clarity.", "You bring warmth, loyalty, and emotional attention to relationships.", "Uncertainty can turn into over-reading or repeated checking.", "Pause before following the first story your nervous system creates."),
      architect: profile("architect", "The Self-Protective Distancer", "You restore safety by creating space and thinking privately. Independence helps you regulate before you can reconnect.", "You rarely react impulsively and protect both people from unnecessary escalation.", "Too much distance can make your care difficult for others to feel.", "Name that you need space—and when you plan to return to the conversation."),
      creator: profile("creator", "The Push-Pull Heart", "You can want deep closeness and personal freedom at the same time. Your response changes with how safe and understood the moment feels.", "You sense emotional complexity that simpler labels miss.", "Mixed signals can leave both you and the other person guessing.", "Choose one honest sentence that holds both truths at once."),
    },
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
    results: {
      explorer: profile("explorer", "Freedom to Move", "You feel most like yourself when there is room to choose, explore, and change direction.", "You revive possibility when other people feel stuck.", "Too many obligations can make you disappear before explaining why.", "Protect a small pocket of choice inside your current commitments."),
      connector: profile("connector", "To Be Truly Understood", "Your deepest need is not constant attention—it is the feeling that someone genuinely gets the meaning beneath your words.", "You create rare emotional depth and mutual trust.", "You may over-give while waiting for someone to notice what you need.", "Say the unspoken need plainly to one safe person."),
      architect: profile("architect", "Safety Through Clarity", "You settle when expectations, plans, and boundaries are dependable. Knowing where you stand lets your softer side come forward.", "You make uncertain situations feel steady and workable.", "You can mistake total certainty for the minimum required safety.", "Define what is knowable now and let the rest stay open."),
      creator: profile("creator", "Space to Express", "You need room for imagination, beauty, and honest expression. Without it, even a full life can feel emotionally flat.", "You give form to feelings other people struggle to name.", "Inspiration can become escape when practical needs feel heavy.", "Make something small before you try to solve everything."),
    },
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
    results: {
      explorer: profile("explorer", "The Direct Navigator", "You would rather address tension than let it quietly grow. Movement and honest language help you regain trust.", "You bring momentum and courage to difficult conversations.", "Speed can make the other person feel rushed into resolution.", "Ask whether they need clarity now or a little time first."),
      connector: profile("connector", "The Harmony Keeper", "You instinctively protect connection, soften sharp edges, and look for the feeling beneath the argument.", "You de-escalate conflict and help people feel human again.", "Peace can cost too much when you hide your real position.", "State one non-negotiable before you start accommodating."),
      architect: profile("architect", "The Calm Analyst", "You step back, sort the facts, and return when the situation makes more sense. Structure is how you prevent chaos.", "You separate signal from emotional noise.", "Analysis can sound like distance when reassurance is needed first.", "Lead with care, then move into the facts."),
      creator: profile("creator", "The Emotional Truth-Teller", "You respond to the full emotional meaning of a conflict, not only the surface issue. Authenticity matters more than perfect composure.", "You uncover what the argument is really about.", "Intensity can turn insight into overwhelm.", "Choose the most important truth and say only that first."),
    },
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
    results: {
      explorer: profile("explorer", "The Social Spark", "Novel people and spontaneous plans wake you up. You connect through motion, humor, and shared experiences.", "You make groups feel open and alive.", "You can outrun your need for recovery.", "Leave the party while you still have a little energy left."),
      connector: profile("connector", "The Selective Connector", "You enjoy people most when the interaction has warmth and meaning. One real conversation can energize you more than a crowded room.", "You build bonds that feel personal and lasting.", "You may stay too long when someone needs you.", "Notice the first quiet sign that your attention is fading."),
      architect: profile("architect", "The Quiet Observer", "You like having time to read the room before entering it. Familiarity and a clear role make social situations easier.", "You notice dynamics other people miss.", "Waiting for the perfect opening can make you seem more distant than you feel.", "Offer one small signal of interest early."),
      creator: profile("creator", "The Solo Recharger", "Your richest energy often returns in private. Solitude is not a rejection of people—it is where your inner world becomes audible again.", "You bring originality and presence after genuine recovery.", "Too much retreat can make reconnecting feel harder than it is.", "Plan the return as intentionally as the alone time."),
    },
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
    results: {
      explorer: profile("explorer", "Shared Adventure", "Love feels real when someone chooses an experience with you and meets you in the aliveness of the moment.", "You keep relationships curious and growing.", "Everyday consistency can feel less visible than big moments.", "Notice one ordinary act of love today."),
      connector: profile("connector", "Words That See You", "Specific, sincere words reach you because they show that someone has been paying attention to who you really are.", "You make appreciation emotionally precise.", "Silence can feel more negative than it was intended.", "Ask for reassurance without apologizing for needing it."),
      architect: profile("architect", "Acts That Make Life Lighter", "Care lands through follow-through: the task remembered, the promise kept, the burden quietly shared.", "You turn affection into dependable support.", "You may overlook love expressed less practically.", "Tell people which small action would help most."),
      creator: profile("creator", "Thoughtful Ritual", "You feel loved through details that carry meaning—a chosen object, a familiar ritual, or a moment made beautiful on purpose.", "You make connection memorable and personal.", "Unplanned care may seem less meaningful than it is.", "Look for intention, even when the form is imperfect."),
    },
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
    results: {
      explorer: profile("explorer", "The Movement Reset", "Stress begins to loosen when your body moves and the scenery changes. Momentum helps your thoughts reorganize.", "You can shift stagnant energy quickly.", "Constant movement can postpone the feeling underneath.", "Move first, then give the feeling a name."),
      connector: profile("connector", "The Connected Reset", "A safe voice, shared silence, or honest conversation helps your system remember that you are not carrying everything alone.", "You regulate through genuine human connection.", "You may reach for people who do not have capacity.", "Ask whether someone can listen before you begin."),
      architect: profile("architect", "The Order Reset", "A clear list, clean surface, or workable plan reduces mental noise. Structure gives your attention somewhere safe to land.", "You turn overwhelm into manageable next steps.", "Organizing can become a substitute for resting.", "Stop after the first useful layer of order."),
      creator: profile("creator", "The Quiet Reset", "You recover through low stimulation, imagination, and time that belongs to nobody else.", "You can transform overload into insight.", "Retreat can stretch into avoidance when there is no return point.", "Set a gentle time to re-enter the day."),
    },
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
    results: {
      explorer: profile("explorer", "The Direct Boundary Setter", "You prefer a clear yes or no and trust that honesty prevents resentment later.", "People usually know where they stand with you.", "Directness can land harder than you intend.", "Keep the boundary firm and the delivery warm."),
      connector: profile("connector", "The Compassionate Negotiator", "You consider context and feelings before drawing a line. You want the boundary to protect connection, not punish it.", "You make difficult limits feel humane.", "You may negotiate past your own capacity.", "Decide your limit before entering the conversation."),
      architect: profile("architect", "The Private Gatekeeper", "You value clear ownership of your time, information, and inner world. Trust grows through consistency.", "You protect what matters without needing constant approval.", "People may not know how to get closer.", "Offer one clear door in, not only the walls."),
      creator: profile("creator", "The Flexible-Until-Full Type", "You adapt generously in the moment, then notice your limit once it has already been crossed.", "You bring openness and spontaneity to relationships.", "Delayed boundaries can arrive as sudden withdrawal.", "Practice naming discomfort at thirty percent, not ninety."),
    },
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
    results: {
      explorer: profile("explorer", "Bold Initiation", "You create movement when everyone else is still evaluating. Your willingness to begin gives possibility a real shape.", "You turn uncertainty into useful experiments.", "Starting is easier than staying with the final details.", "Choose one finish line before the next beginning."),
      connector: profile("connector", "Emotional Translation", "You notice what people mean beneath what they say and help a room become more honest without forcing it.", "You build trust across very different personalities.", "Carrying the emotional room can become invisible labor.", "Let one feeling belong to the person who brought it."),
      architect: profile("architect", "Systems Thinking", "You see the structure beneath the mess—what connects, what is missing, and what will still work later.", "You create clarity people can depend on.", "You may undervalue ideas that are not fully formed yet.", "Leave one deliberate space for surprise."),
      creator: profile("creator", "Pattern Seeing", "Your mind connects details, moods, and possibilities that other people keep separate. Originality is your natural way of making sense.", "You reveal fresh meaning in familiar things.", "Too many connections can make action feel diffuse.", "Give the best idea one simple container."),
    },
  },
];

const images = [
  "/quiz/doors.png",
  "/quiz/rooms.png",
  "/quiz/landscapes.png",
  "/quiz/symbols.png",
] as const;

type CompactQuestion = {
  kicker: string;
  prompt: string;
  options: [string, string, string, string];
};

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
  (questionSets[test.id] ?? []).map((question, questionIndex) => ({
    id: `${test.id}-${questionIndex + 1}`,
    testId: test.id,
    kicker: question.kicker,
    prompt: question.prompt,
    atlasPath: images[questionIndex % images.length],
    position: questionIndex + 1,
    active: true,
    options: question.options.map((label, optionIndex) => {
      const scoreKey = TRAIT_KEYS[optionIndex];
      return { label, microcopy: optionDetails[scoreKey], scoreKey };
    }),
  })),
);

export const resultProfiles = defaultTests[0].results;

export function calculateResult(
  answers: Record<string, TraitKey>,
  profiles: Record<TraitKey, ResultProfile> = resultProfiles,
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
  return profiles[winner];
}
