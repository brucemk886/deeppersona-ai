import {
  ATTACHMENT_LOOPS,
  ATTACHMENT_OVERVIEWS,
  ATTACHMENT_RESULTS,
  ATTACHMENT_STYLE_META,
  dimensionScore,
  optionStyle,
  scoreAttachment,
  scoreAttachmentSubset,
  selfWorthSnapshot,
  type AttachmentStyle,
} from "./attachment";
import type { DeepResultContent } from "./deep-results";
import type { QuizQuestion, ResultProfile } from "./quiz";

export const ROMANCE_MODULE = "Romance";
export const SELF_ESTEEM_MODULE = "Self-esteem";
export const CHILDHOOD_MODULE = "Childhood";

export const REPORT_INCLUSIONS = [
  "An interpretation of every choice you selected",
  "Pairing notes versus each of the four styles",
  "Seven-day micro practices",
];

export const BLUR_FILLER =
  "This longer reading follows the pictures you chose and the first move they suggest in closeness, silence, repair, and self-talk. It stays behind the lock until you open the full report. The sentences here are only a visual tease, not the paid interpretation.";

const ESSAYS: Record<AttachmentStyle, { dating: string; conflict: string; need: string }> = {
  anxious: {
    dating: "When dating, you tend to treat small shifts in warmth as information you need right now. A cooler reply, an unnamed relationship, or a night they want alone can pull your attention into the bond before the rest of the evening has a chance. That alertness is often protecting a real wish to stay connected, not a wish to control the other person. The cost is that your body may start working on a problem that has not been stated yet.",
    conflict: "When conflict starts, you tend to close the gap quickly — more texts, more examples, another apology. An open rupture can feel like the relationship is already leaving the room. The chase is protecting you from sitting in a silence that used to mean something bad. Repair still matters; it just does not have to happen at the hottest minute.",
    need: "What you often need is a visible thread: a return time, a plain sentence, a plan that makes the pause feel shared. When that thread is missing, you tend to invent one with checking and reaching. A calmer version of the same need is to ask for one concrete sign, then do one thing that belongs only to you.",
  },
  avoidant: {
    dating: "When dating, you tend to protect pace. More affection, a label, or three days in a row can make the air feel thinner, so you reach for work, the gym, headphones, or a shorter reply. That move is often protecting a mind that still wants the person — just not the merger. The cost is that the other person may only see the door, not the care on the other side of it.",
    conflict: "When voices get sharp, you tend to leave the room, go quiet, or call it fine while staying distant inside. Distance can feel like the only way not to make it worse. The withdrawal is protecting both of you from the next sharp sentence. It becomes a problem when the return never gets a time.",
    need: "What you often need is room that does not have to be explained as rejection. A sentence that keeps the connection visible — “I need an hour, then I will come back” — lets the space do its job without turning into a vanishing. You can keep your independence and still leave a light on.",
  },
  secure: {
    dating: "When dating, you tend to want closeness and your own life in the same week. You can enjoy a warmer stretch, ask for a label at a calm time, and take a few hours apart without treating either move as a verdict. That balance is protecting a bond that can survive ordinary weather. The watch-out is under-asking: being “fine” can hide a preference that would help the other person.",
    conflict: "When conflict starts, you tend to pause with a return time, name what is still missing once, and watch what happens next. You treat repair as words plus a next action. That sequence is protecting the conversation from both explosion and disappearance. It still works better when you say the good pattern out loud so it is easier to repeat.",
    need: "What you often need is clarity without drama: the headline of a hard day, one concrete change, affection without a campaign. You already have more of this than you may notice. Keep using it when the moment is still small, including on days you could coast.",
  },
  fearful: {
    dating: "When dating, you tend to want the closeness and the exit in the same stretch of time. A good week can make you melt in tonight and go quiet tomorrow. An unnamed bond can make you want the label and fear the trap. Those mixed moves are protecting you from two losses at once: being left, and being locked in. The cost is that neither you nor the other person knows which hour they are in.",
    conflict: "When conflict starts, you tend to push away and then panic they will not come back, or explode and then ghost. The reach and the retreat can be two halves of one move. That swing is protecting you from staying in heat you cannot predict. Repair begins when you finish one move — pause or reach — before switching.",
    need: "What you often need is a smaller ask and a named return: “I want you, and I also need twenty minutes.” Mixed feelings do not have to become mixed signals. When you say both parts, the pattern has less work to do in the dark.",
  },
};

const PAIRING: Record<AttachmentStyle, { style: AttachmentStyle; note: string }[]> = {
  anxious: [
    { style: "anxious", note: "With another anxious person, you tend to chase in stereo. When X happens — a late reply — both of you may flood the thread. One of you naming a return time can keep the night from becoming a two-person spiral." },
    { style: "avoidant", note: "With an avoidant person, your reach can meet their space. When they go quiet, you tend to move closer, which can make them need more air. Ask for one check-in and give the hour they asked for." },
    { style: "secure", note: "With a securer person, their steadiness can feel like relief and, at first, like not enough heat. When they stay calm, you may still scan for danger. Let their consistent next step count as data." },
    { style: "fearful", note: "With a fearful-avoidant person, both of you can want contact and fear it. When one of you pulls away, the other may panic-reach. Agree on a pause-with-time so the swing has a rail." },
  ],
  avoidant: [
    { style: "anxious", note: "With an anxious person, your need for air can sound like a closed door. When you go quiet, they tend to chase. A return time is often more useful than a longer explanation." },
    { style: "avoidant", note: "With another avoidant person, the house can get very quiet. When something is wrong, both of you may handle it alone. One headline a week keeps the bond from going blank." },
    { style: "secure", note: "With a securer person, they may give you space and still want a sentence. When you take the room, they will usually wait if they know when you are coming back." },
    { style: "fearful", note: "With a fearful-avoidant person, your withdrawal can confirm their fear of being left, then their reach can feel like pressure. Keep the space, and leave a light on." },
  ],
  secure: [
    { style: "anxious", note: "With an anxious person, your calm can soothe them — or feel like you are not worried enough. When they chase, a specific next touchpoint usually helps more than “we are fine.”" },
    { style: "avoidant", note: "With an avoidant person, you can honor space without disappearing into it. When they go quiet, ask for a return time rather than filling the gap with mind-reading." },
    { style: "secure", note: "With another securer person, repair is often available. The watch-out is coasting: say the good pattern out loud so it does not have to be guessed." },
    { style: "fearful", note: "With a fearful-avoidant person, mixed signals are the weather. When they melt in and then pull away, name both parts and keep the next meeting on the calendar." },
  ],
  fearful: [
    { style: "anxious", note: "With an anxious person, your pull-away can start their chase, and their chase can start your next exit. When the loop starts, pick one timed pause instead of both accelerating." },
    { style: "avoidant", note: "With an avoidant person, both of you can vanish after heat. When you want them and also need air, say the air with a time so it does not look like the end." },
    { style: "secure", note: "With a securer person, their steadiness can feel like a place to land — and like a spotlight. When you want to run, tell them you need a short pause, not a new verdict." },
    { style: "fearful", note: "With another fearful-avoidant person, push-pull can echo. When X happens — a close night or a fight — agree in advance which of you will name the return." },
  ],
};

const PRACTICES: Record<AttachmentStyle, { day: number; title: string; body: string }[]> = {
  anxious: [
    { day: 1, title: "One fact, then the phone down", body: "When a reply is late, write one thing you actually know. Then put the phone in another room for twenty minutes." },
    { day: 2, title: "Ask once", body: "If something feels off, send one clear question. Do not send the second text until they have had a chance to answer." },
    { day: 3, title: "Name the need", body: "Say the need in plain language — a call, a plan, or a goodnight — before you scan for hidden meaning." },
    { day: 4, title: "Keep one thing that is yours", body: "On a warm day in the relationship, keep one plan that does not include them." },
    { day: 5, title: "Repair at a human size", body: "If you miss, own it once. Let their next message be data, not a trial." },
    { day: 6, title: "Receive one kindness", body: "When a compliment lands, say thank you before you ask if they mean it." },
    { day: 7, title: "Give a window", body: "If you need a reply, ask for a time window, then do one thing for yourself inside it." },
  ],
  avoidant: [
    { day: 1, title: "Leave a light on", body: "When you take space, add a return time even if the talk waits." },
    { day: 2, title: "One feeling sentence", body: "Before you change the subject, share one feeling in a short sentence." },
    { day: 3, title: "Headline, not “fine”", body: "If the day was hard, say the headline. You do not have to tell the whole story." },
    { day: 4, title: "Stay visible in the pause", body: "Take the gym or the headphones, and send the time you will be back." },
    { day: 5, title: "Let a compliment exist", body: "Say thank you once. You do not have to become the subject." },
    { day: 6, title: "Return when you said", body: "If you promised twenty minutes, come back at twenty minutes, even with one sentence." },
    { day: 7, title: "Name the pace", body: "If something got suddenly close, say you need a slower tempo instead of only cooling off." },
  ],
  secure: [
    { day: 1, title: "Ask while it is small", body: "Name one preference today while it still feels minor." },
    { day: 2, title: "Check what would help", body: "Ask the other person what would make this moment easier — listening, space, or a plan." },
    { day: 3, title: "Say the good pattern", body: "Name one thing that already works between you so it is easier to repeat." },
    { day: 4, title: "Keep both halves", body: "Take a few hours apart and put dinner, or the next call, on the calendar." },
    { day: 5, title: "Own your part once", body: "In a repeat argument, own one piece and ask for one concrete change." },
    { day: 6, title: "Take the compliment in", body: "Let a kind sentence be true for ten seconds before you move on." },
    { day: 7, title: "Stay present for their weather", body: "If they get vulnerable, listen first. Ask what they need before you add ideas." },
  ],
  fearful: [
    { day: 1, title: "Finish one move", body: "If you want to reach and retreat, pick one and finish it before switching." },
    { day: 2, title: "Say both parts", body: "Tell them you want closeness and a little room in the same sentence." },
    { day: 3, title: "Write before you send", body: "Write what you need before the next message, especially after a close night." },
    { day: 4, title: "Keep the space you asked for", body: "If you asked for air, take it. Send one time-bounded check-in instead of clinging mid-pause." },
    { day: 5, title: "Do not hitch old fights", body: "If an apology felt incomplete, write the leftover sentence tonight instead of saving it for the next argument." },
    { day: 6, title: "Let help stay", body: "If someone already came when you asked, do not say “never mind” as the door opens." },
    { day: 7, title: "Morning after", body: "If you pulled them close at night, send one kind, low-urgency morning note so noon distance has a reason." },
  ],
};

const REWRITES: Record<AttachmentStyle, { from: string; to: string }[]> = {
  anxious: [
    { from: "If they are quiet, I am already losing them.", to: "They are quiet. I know one fact, and I can ask one question later." },
    { from: "I have to fix this now or it will not be okay.", to: "Repair can wait twenty minutes and still count." },
    { from: "A compliment only counts if I can prove they mean it.", to: "I can receive this sentence once before I test it." },
  ],
  avoidant: [
    { from: "If I need space, I should just disappear until I feel better.", to: "I can take space and still say when I will be back." },
    { from: "If I open this, it will take everything.", to: "I can share the headline without handing over the whole day." },
    { from: "Needing someone is a hassle.", to: "I can want someone and still keep a life of my own." },
  ],
  secure: [
    { from: "I am fine, so I should not ask.", to: "I can say a small preference while it is still small." },
    { from: "If I stay even, they will know I care.", to: "They may need a clearer signal than my calm." },
    { from: "A wobble means I was wrong about us.", to: "Things can wobble and I can still be worthy of a steady bond." },
  ],
  fearful: [
    { from: "If I let this feel good, I will ruin it tomorrow.", to: "Tonight can be warm, and tomorrow can still have a plan." },
    { from: "I have to get out before they get out.", to: "I can take twenty minutes without turning it into a vanishing." },
    { from: "I do not deserve steady love.", to: "Some hours I feel sure, some hours I do not — neither hour gets to send the 2 a.m. text." },
  ],
};

function selectedEntries(questions: QuizQuestion[], choices: Record<string, number>) {
  return questions
    .map((question, index) => {
      const selectedIndex = choices[question.id];
      const option = Number.isInteger(selectedIndex) ? question.options[selectedIndex] : undefined;
      return option ? { question, option, selectedIndex, index } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function entriesFor(entries: ReturnType<typeof selectedEntries>, kicker: string) {
  return entries.filter((entry) => entry.question.kicker === kicker);
}

function styleCounts(entries: ReturnType<typeof selectedEntries>) {
  const counts: Record<AttachmentStyle, number> = { anxious: 0, avoidant: 0, secure: 0, fearful: 0 };
  for (const entry of entries) counts[optionStyle(entry.option, entry.selectedIndex)] += 1;
  return counts;
}

export function childhoodTeaser(questions: QuizQuestion[], choices: Record<string, number>, style: AttachmentStyle, locked = true) {
  return caregiverIntro(questions, choices, style, locked);
}

export function caregiverIntro(
  questions: QuizQuestion[],
  choices: Record<string, number>,
  style: AttachmentStyle,
  includeEcho = true,
) {
  const childhood = entriesFor(selectedEntries(questions, choices), CHILDHOOD_MODULE);
  const lead = childhood[0]?.option.label;
  const second = childhood[1]?.option.label;
  const specific = lead
    ? ` When you were upset or needed help as a kid, scenes like “${lead}” felt familiar${second && second !== lead ? `, and later “${second}” pointed the same way` : ""}.`
    : "";
  const echo = includeEcho
    ? ` Those scenes can still echo in this adult pattern: ${ATTACHMENT_STYLE_META[style].blurb}`
    : "";
  return `Your caregiver attachment patterns reflect the emotional expectations you learned in your first close relationships. These patterns can influence how you interpret closeness, distance, conflict, and reassurance in adulthood. They are not blame statements about caregivers — they describe the relational experience you internalized and how it may echo now.${specific}${echo}`;
}

export function sentenceCount(text: string): number {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1).length;
}

function citedEntries(questions: QuizQuestion[], choices: Record<string, number>, kicker: string) {
  const entries = selectedEntries(questions, choices);
  const matched = entriesFor(entries, kicker);
  return matched.length ? matched : entries;
}

export function romanceEssay(questions: QuizQuestion[], choices: Record<string, number>, style: AttachmentStyle) {
  const romance = citedEntries(questions, choices, ROMANCE_MODULE);
  const labels = romance.slice(0, 3).map((entry) => entry.option.label);
  const [first, second, third] = labels;
  const pick = (label: string | undefined, fallback: string) => (label ? `“${label}”` : fallback);
  const essays: Record<AttachmentStyle, string> = {
    anxious: [
      "When a bond feels unclear, your attention often goes to the relationship first.",
      "Silence, a cooler reply, or an unnamed status can pull the rest of the evening into the thread.",
      `In one scene you chose ${pick(first, "a move that closes the gap")}.`,
      second ? `In another, ${pick(second, "a second reach")} felt closer to your first move.` : "You look for a visible sign that you still matter before the rest of the night can settle.",
      "That alertness is usually protecting a real wish to stay connected, not a wish to control the other person.",
      "The cost is that your body may start working on a problem that has not been stated yet.",
      "When conflict starts, you tend to close the gap quickly — more texts, more examples, another apology.",
      third ? `When closeness or repair was on the table, you also picked ${pick(third, "a repair move")}.` : "An open rupture can feel like the relationship is already leaving the room.",
      "What you often need is a visible thread: a return time, a plain sentence, a plan that makes the pause feel shared.",
      "A calmer version of the same need is to ask for one concrete sign, then do one thing that belongs only to you.",
    ].join(" "),
    avoidant: [
      "When a relationship speeds up, you often reach for space, tasks, or self-reliance.",
      "More affection, a label, or three days in a row can make the air feel thinner.",
      `In one scene you chose ${pick(first, "a move that protects pace")}.`,
      second ? `In another, ${pick(second, "a quieter exit")} felt closer to your first move.` : "Distance can feel like the fastest way to get your mind back.",
      "That move is often protecting a mind that still wants the person — just not the merger.",
      "The cost is that the other person may only see the door, not the care on the other side of it.",
      "When voices get sharp, you tend to leave the room, go quiet, or call it fine while staying distant inside.",
      third ? `When closeness or repair was on the table, you also picked ${pick(third, "a space-keeping move")}.` : "Withdrawal protects both of you from the next sharp sentence, until the return never gets a time.",
      "What you often need is room that does not have to be explained as rejection.",
      "A sentence that keeps the connection visible — when you will be back — lets the space do its job without turning into a vanishing.",
    ].join(" "),
    secure: [
      "You can want closeness and your own life in the same week.",
      "A warmer stretch, a calmer ask for clarity, and a few hours apart can all feel like ordinary weather.",
      `In one scene you chose ${pick(first, "a steady check-in")}.`,
      second ? `In another, ${pick(second, "a paced return")} felt closer to your first move.` : "You tend to notice a shift, stay steady, and ask once.",
      "That balance is protecting a bond that can survive ordinary weather.",
      "The watch-out is under-asking: being “fine” can hide a preference that would help the other person.",
      "When conflict starts, you tend to pause with a return time and name what is still missing once.",
      third ? `When closeness or repair was on the table, you also picked ${pick(third, "a repair with a time")}.` : "You treat repair as words plus a next action.",
      "What you often need is clarity without drama: the headline of a hard day, one concrete change, affection without a campaign.",
      "Keep using that when the moment is still small, including on days you could coast.",
    ].join(" "),
    fearful: [
      "You tend to want the closeness and the exit in the same stretch of time.",
      "A good week can make you melt in tonight and go quiet tomorrow.",
      `In one scene you chose ${pick(first, "a mixed reach-and-retreat")}.`,
      second ? `In another, ${pick(second, "a second mixed move")} felt closer to your first move.` : "An unnamed bond can make you want the label and fear the trap.",
      "Those mixed moves are protecting you from two losses at once: being left, and being locked in.",
      "The cost is that neither you nor the other person knows which hour they are in.",
      "When conflict starts, you tend to push away and then panic they will not come back.",
      third ? `When closeness or repair was on the table, you also picked ${pick(third, "both a reach and a retreat")}.` : "The reach and the retreat can be two halves of one move.",
      "What you often need is a smaller ask and a named return: you want them, and you also need twenty minutes.",
      "When you say both parts, the pattern has less work to do in the dark.",
    ].join(" "),
  };
  return essays[style];
}

export function selfWorthSentences(
  questions: QuizQuestion[],
  choices: Record<string, number>,
  style: AttachmentStyle,
) {
  const self = entriesFor(selectedEntries(questions, choices), SELF_ESTEEM_MODULE);
  const { sentence } = worthPattern(questions, choices, style);
  const lead = self[0]?.option.label;
  const { level } = selfWorthSnapshot(questions, choices);
  const levelLine = {
    Low: "On these items, self-worth showed up as something you still have to prove or protect.",
    Medium: "On these items, self-worth held in some scenes and wobbled in others.",
    High: "On these items, self-worth more often stayed with you even when a scene got tender.",
  }[level];
  return [
    sentence,
    lead ? `On a self-esteem scene you chose “${lead}.”` : "",
    levelLine,
    "This is a snapshot of how worth showed up in the choices you picked, not a verdict on your value.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function worthPattern(questions: QuizQuestion[], choices: Record<string, number>, style: AttachmentStyle) {
  const self = entriesFor(selectedEntries(questions, choices), SELF_ESTEEM_MODULE);
  const counts = styleCounts(self);
  const dominant = (Object.entries(counts) as [AttachmentStyle, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? style;
  const sentence = {
    anxious: "When worth is on the line, you tend to look for proof that you are still chosen.",
    avoidant: "When worth is on the line, you tend to lean on self-reliance and cool the feeling down.",
    secure: "When worth is on the line, you tend to feel a flicker without writing yourself off.",
    fearful: "When worth is on the line, you tend to feel good and then later feel undeserving.",
  }[dominant];
  const bullets: string[] = self.slice(0, 2).map((entry) => {
    if (entry.question.position === 13) return "A sincere compliment still has to get past a test before you can keep it.";
    if (entry.question.position === 14) return "A small miss can turn into a larger story about whether they will stay.";
    if (entry.question.position === 15) return "Someone who looks “more” in their world can become a referendum on you.";
    return "Late at night, “do I deserve steady love?” can get a louder vote than the day’s facts.";
  });
  while (bullets.length < 2) {
    bullets.push(dominant === "avoidant"
      ? "Being loved can start to feel like a hassle when it asks to be felt."
      : "A compliment or a miss can still become a story about whether you are enough.");
  }
  return { sentence, bullets: bullets.slice(0, 2) };
}

function moduleFrom(title: string, entries: ReturnType<typeof selectedEntries>, extra: string, reflection: string) {
  const labels = entries.map((entry) => `“${entry.option.label}”`).join(", ");
  return {
    title,
    explanation: `In these situations, you chose ${labels || "no choices yet"}.\n\n${extra}`,
    reflection,
  };
}

export function buildAttachmentReport(
  questions: QuizQuestion[],
  choices: Record<string, number>,
): { result: ResultProfile; deepResult: DeepResultContent } {
  const scored = scoreAttachment(questions, choices);
  const profile = ATTACHMENT_RESULTS[scored.style];
  const meta = ATTACHMENT_STYLE_META[scored.style];
  const entries = selectedEntries(questions, choices);
  const romance = citedEntries(questions, choices, ROMANCE_MODULE);
  const selfEsteem = entriesFor(entries, SELF_ESTEEM_MODULE);
  const childhood = entriesFor(entries, CHILDHOOD_MODULE);
  const loop = ATTACHMENT_LOOPS[scored.style];
  const essay = ESSAYS[scored.style];
  const caregiverScored = scoreAttachmentSubset(questions, choices, CHILDHOOD_MODULE);
  const worth = selfWorthSnapshot(questions, choices);

  return {
    result: {
      ...profile,
      key: scored.style,
      title: meta.label,
      themeTitle: scored.dualHigh && scored.secondary
        ? `${meta.label} and ${ATTACHMENT_STYLE_META[scored.secondary].label} both scored highest.`
        : meta.blurb,
      summary: profile.summary,
      anxiety: scored.anxiety,
      avoidance: scored.avoidance,
      ...(scored.secondary ? { secondaryKey: scored.secondary, dualHigh: scored.dualHigh } : {}),
    },
    deepResult: {
      romanceEssay: romanceEssay(questions, choices, scored.style),
      scores: dimensionScore(scored.anxiety, scored.avoidance),
      caregiver: caregiverScored.answered ? {
        intro: caregiverIntro(questions, choices, scored.style),
        ...dimensionScore(caregiverScored.anxiety, caregiverScored.avoidance),
      } : undefined,
      selfWorth: {
        ...worth,
        sentences: selfWorthSentences(questions, choices, scored.style),
      },
      characteristics: [
        ...ATTACHMENT_OVERVIEWS[scored.style].dating,
        ...ATTACHMENT_OVERVIEWS[scored.style].withSelf,
      ],
      superpowers: profile.strengths ?? [profile.strength],
      triggers: profile.stuckPoints ?? [profile.watchout],
      modules: [
        moduleFrom(
          romance.length && romance.length === entriesFor(entries, ROMANCE_MODULE).length ? ROMANCE_MODULE : "First reactions",
          romance,
          "These scenes follow your first move when closeness, silence, labels, or repair are on the table. Compare the wording you chose with what you actually do when the same moment happens.",
          "When the next pause or burst of closeness arrives, which of these first moves do you want to keep?",
        ),
        ...(selfEsteem.length ? [moduleFrom(
          SELF_ESTEEM_MODULE,
          selfEsteem,
          "These self-esteem scenes follow what happens to your worth when you are praised, when you miss, when you compare, and when the night gets quiet. The full rewrite of that self-talk is in the paid module below.",
          "Which night-time sentence about deserving love still runs, and what would a kinder one sound like?",
        )] : []),
        ...(childhood.length ? [moduleFrom(
          CHILDHOOD_MODULE,
          childhood,
          "These childhood scenes are not a diagnosis of your caregivers. They are a trail of how you learned to get comfort, show feeling, ask for help, and say goodbye. The longer reading sits in the paid childhood module.",
          "Where did today’s first move already exist in a smaller kitchen or doorway?",
        )] : []),
      ],
      lens: {
        title: "A pattern, not a verdict",
        explanation:
          "These scores describe how often your choices leaned toward reaching, stepping back, staying steady, or doing both. They are a reflection prompt for this moment, not a diagnosis, a disorder label, or a fixed identity. A preference can have several explanations; it cannot establish childhood facts or speak for another person.",
        reflectionPrompt: loop.steps[0] ? `When ${loop.steps[0].toLowerCase()}, which next step would you rather practice?` : meta.blurb,
      },
      essay,
      childhood: childhood.length ? {
        title: "Where this may have started",
        paragraphs: [
          childhoodTeaser(questions, choices, scored.style, false),
          ...childhood.map((entry) => entry.option.meaning),
          `What the pattern is protecting: a younger version of you who needed a predictable welcome. You can keep the wisdom of that protection and still try a smaller, present-tense ask.`,
        ],
        reflection: "If you could stand in that childhood doorway again, what would “help” have looked like in one sentence?",
      } : undefined,
      selfEsteem: {
        title: "Your worth pattern",
        paragraphs: [
          worthPattern(questions, choices, scored.style).sentence,
          ...selfEsteem.map((entry) => entry.option.meaning),
        ],
        rewrites: REWRITES[scored.style],
      },
      pairing: PAIRING[scored.style].map((item) => ({
        style: ATTACHMENT_STYLE_META[item.style].label,
        note: item.note,
      })),
      practices: PRACTICES[scored.style],
      loop,
      overview: [
        { title: "In dating", points: ATTACHMENT_OVERVIEWS[scored.style].dating },
        { title: "With yourself", points: ATTACHMENT_OVERVIEWS[scored.style].withSelf },
        { title: "Under stress", points: ATTACHMENT_OVERVIEWS[scored.style].underStress },
      ],
    },
  };
}

export function typeOverview(style: AttachmentStyle) {
  return ATTACHMENT_OVERVIEWS[style];
}
