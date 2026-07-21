import type { ResultProfile, TraitKey } from "@/lib/quiz";

type TestLens = {
  title: string;
  explanation: string;
  reflectionPrompt: string;
};

type TraitDepth = {
  coreDrive: string;
  inRelationships: string;
  underPressure: string;
};

const testLenses: Record<string, TestLens> = {
  "attachment-style": {
    title: "How you try to restore safety in closeness",
    explanation: "Your choices point to the strategy you are most likely to use when connection feels uncertain. It is not a fixed attachment diagnosis. Think of it as your current default: the route your nervous system reaches for before reflection has time to catch up. Different relationships can bring out different versions of you.",
    reflectionPrompt: "When someone important becomes less available, what do you need to hear, know, or do before your body believes the connection is still safe?",
  },
  "emotional-needs": {
    title: "The condition that helps your inner world soften",
    explanation: "This result highlights the emotional condition you tend to seek when life becomes noisy: movement, understanding, clarity, or expression. The need itself is not a weakness. Difficulty usually begins when you expect other people to notice it without being told, or when you use one need to avoid another.",
    reflectionPrompt: "What would meeting this need in a healthy, self-directed way look like before you ask another person to meet it for you?",
  },
  "conflict-style": {
    title: "Your first attempt to make tension manageable",
    explanation: "Conflict style is less about whether you are good or bad at disagreement and more about what you protect first: momentum, connection, logic, or emotional truth. Your strongest pattern can be a real skill. It becomes costly only when it is used before the other person has enough safety to receive it.",
    reflectionPrompt: "In your last difficult conversation, what were you protecting first—and what did the other person probably need first?",
  },
  "social-energy": {
    title: "The kind of contact your attention can actually sustain",
    explanation: "Your social battery is shaped by stimulation, emotional responsibility, familiarity, and the depth of attention being asked from you. This result describes the conditions in which your social presence feels most natural. It does not mean you are permanently introverted or extroverted.",
    reflectionPrompt: "Which part of socializing drains you first: noise, performance, emotional caretaking, uncertainty, or lack of meaning?",
  },
  "love-language": {
    title: "The evidence of care your mind notices fastest",
    explanation: "People usually recognize love most easily when it arrives in a familiar form. Your result shows the form that feels most legible to you, not the only kind of care you can receive. Relationships grow when you can ask for your preferred signal while also learning to translate the signals another person naturally gives.",
    reflectionPrompt: "What loving behavior have you dismissed because it did not arrive in your preferred form?",
  },
  "stress-reset": {
    title: "The first condition your system needs before problem-solving",
    explanation: "A useful reset is not the same as avoiding the problem. Your choices suggest the doorway through which regulation is easiest for you: movement, connection, order, or low stimulation. Once your system settles, you are more able to decide what the situation actually requires.",
    reflectionPrompt: "How can you tell the difference between a reset that restores you and an escape that delays what matters?",
  },
  "boundary-style": {
    title: "How you protect capacity without losing connection",
    explanation: "Boundaries are information about what you can participate in—not punishment, withdrawal, or proof that someone is wrong. Your result reflects how you naturally communicate limits. The growth edge is making the limit visible early enough that it does not have to arrive as resentment or disappearance.",
    reflectionPrompt: "Which boundary do you repeatedly enforce late, after you have already become tired or resentful?",
  },
  "hidden-strength": {
    title: "The ability you may overlook because it feels natural",
    explanation: "Strengths are easiest to underestimate when they operate automatically. This result points to a capacity you may use without naming it. The goal is not simply to feel good about the label, but to recognize where the strength creates value—and where overusing it turns it into a blind spot.",
    reflectionPrompt: "When did someone last rely on this quality in you, even if they never named it directly?",
  },
};

const traitDepth: Record<TraitKey, TraitDepth> = {
  explorer: {
    coreDrive: "You are organized around movement, possibility, and agency. When you can choose a direction and act on it, you feel more like yourself. You often understand an experience by entering it rather than observing it from a safe distance.",
    inRelationships: "You bring momentum and freshness. People may experience you as brave, energizing, and willing to name what others avoid. Your care is often expressed through action. The subtle risk is moving toward a solution before the emotional meaning of the moment has fully landed.",
    underPressure: "Your first impulse is to do something—initiate, change the environment, open another option, or push for clarity. This can interrupt helplessness, but speed may also keep you one step ahead of grief, uncertainty, or the need to stay with an unfinished feeling.",
  },
  connector: {
    coreDrive: "You are organized around emotional contact, mutual understanding, and signs that the bond is intact. You notice tone, distance, and small shifts quickly. Feeling accurately met often matters more than receiving a perfect solution.",
    inRelationships: "You bring warmth, loyalty, and the ability to make people feel seen. You are often the person who remembers context and repairs emotional distance. The cost appears when connection becomes a job you perform alone or when another person’s mood becomes evidence about your worth.",
    underPressure: "Your attention moves toward the relationship: checking, explaining, accommodating, or searching for reassurance. Reaching out can be regulating, but repeated checking may briefly soothe uncertainty while teaching your nervous system that uncertainty itself is dangerous.",
  },
  architect: {
    coreDrive: "You are organized around clarity, reliability, and enough structure to think well. You trust what is consistent and prefer to understand the shape of a situation before exposing your softer reactions. Privacy is often how you protect accuracy, not evidence that you do not care.",
    inRelationships: "You bring steadiness, follow-through, and an ability to make confusing situations workable. People can depend on your judgment. The relational gap appears when the solution is visible but your care is not; others may need an emotional headline before they can appreciate the structure you offer.",
    underPressure: "You reduce input, separate facts from noise, and create a plan. That often prevents impulsive decisions. Yet analysis can become armor when no amount of thinking can remove uncertainty, or when another person needs to know you are emotionally present before the problem is solved.",
  },
  creator: {
    coreDrive: "You are organized around meaning, emotional truth, and room for complexity. You notice patterns and contradictions that do not fit neat categories. Expression helps you discover what you feel; it is not merely decoration added after the thinking is done.",
    inRelationships: "You bring depth, originality, and language for experiences other people struggle to name. You can make a relationship feel vivid and deeply personal. The challenge is translating a rich inner experience into signals simple enough for another person to understand and respond to.",
    underPressure: "Your inner world becomes louder and more associative. You may retreat, imagine several meanings, or wait for the moment to feel right. This can produce genuine insight, but without a container it may turn one difficult feeling into many possible stories and delay a clear next step.",
  },
};

const fallbackLens: TestLens = {
  title: "What your choices may be pointing toward",
  explanation: "This result reflects the pattern that appeared most often across your visual choices. Treat it as a useful hypothesis, not a permanent label. Context, stress, culture, and the relationship in front of you can all change how the pattern shows up.",
  reflectionPrompt: "Where does this description feel accurate—and where does your real experience resist the label?",
};

export function getDeepResultContent(testId: string, result: ResultProfile) {
  return {
    lens: testLenses[testId] ?? fallbackLens,
    depth: traitDepth[result.key],
  };
}
