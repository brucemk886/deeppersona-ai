// Astro reading: chart maths, quiz definitions, fixed report library and plan projection.
// Pure module (no runtime imports) so it can run in the Worker, the browser and `node --test`.

export const ASTRO_TEST_ID = "astro-reading";
export const ASTRO_TITLE = "Your Love Reading";
export const ASTRO_VERSION = 4;

export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Sign = { name: string; glyph: string; element: Element };
export type PlanId = "basic" | "full";
export type Access = "free" | PlanId;

export const PLANS: Record<PlanId, { cents: number; name: string; blurb: string }> = {
  basic: { cents: 499, name: "Love Report", blurb: "The 3 core chapters of your love reading" },
  full: { cents: 999, name: "Complete Love Reading", blurb: "Everything in the Love Report + the deeper chapters" },
};

export function planForAmount(cents: number | null | undefined): PlanId | null {
  if (cents === PLANS.full.cents) return "full";
  if (cents === PLANS.basic.cents) return "basic";
  return null;
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "basic" || value === "full";
}

/* ---------- chart maths ---------- */

export const ZODIAC: readonly Sign[] = [
  { name: "Aries", glyph: "♈", element: "Fire" }, { name: "Taurus", glyph: "♉", element: "Earth" },
  { name: "Gemini", glyph: "♊", element: "Air" }, { name: "Cancer", glyph: "♋", element: "Water" },
  { name: "Leo", glyph: "♌", element: "Fire" }, { name: "Virgo", glyph: "♍", element: "Earth" },
  { name: "Libra", glyph: "♎", element: "Air" }, { name: "Scorpio", glyph: "♏", element: "Water" },
  { name: "Sagittarius", glyph: "♐", element: "Fire" }, { name: "Capricorn", glyph: "♑", element: "Earth" },
  { name: "Aquarius", glyph: "♒", element: "Air" }, { name: "Pisces", glyph: "♓", element: "Water" },
];
const SUN_START: ReadonlyArray<readonly [number, number]> = [[3, 21], [4, 20], [5, 21], [6, 21], [7, 23], [8, 23], [9, 23], [10, 23], [11, 22], [12, 22], [1, 20], [2, 19]];

export function signIndex(name: string) {
  return ZODIAC.findIndex((sign) => sign.name === name);
}

export function sunSign(month: number, day: number): Sign {
  for (let i = 0; i < 12; i++) {
    const [sm, sd] = SUN_START[i];
    const [nm, nd] = SUN_START[(i + 1) % 12];
    if ((month === sm && day >= sd) || (month === nm && day < nd)) return ZODIAC[i];
  }
  return ZODIAC[9];
}

// Low-precision lunar longitude (Meeus, simplified; about 1-2 degrees). Time is treated as UTC; noon when unknown.
export function moonLongitude(year: number, month: number, day: number, time?: string | null) {
  let hour = 12, minute = 0;
  if (time) { const [h, m] = time.split(":"); hour = Number(h); minute = Number(m); }
  const jd = Date.UTC(year, month - 1, day, hour, minute) / 864e5 + 2440587.5;
  const d = jd - 2451545.0;
  const rad = Math.PI / 180;
  const L = 218.316 + 13.176396 * d, M = 134.963 + 13.064993 * d, F = 93.272 + 13.22935 * d;
  const Ms = 357.529 + 0.98560028 * d, D = 297.85 + 12.190749 * d;
  const lon = L + 6.289 * Math.sin(M * rad) - 1.274 * Math.sin((M - 2 * D) * rad) + 0.658 * Math.sin(2 * D * rad)
    - 0.186 * Math.sin(Ms * rad) - 0.114 * Math.sin(2 * F * rad);
  return ((lon % 360) + 360) % 360;
}

export function moonSign(year: number, month: number, day: number, time?: string | null): Sign {
  return ZODIAC[Math.floor(moonLongitude(year, month, day, time) / 30) % 12];
}

export function moonForDay(year: number, month: number, day: number, time?: string | null) {
  const sign = moonSign(year, month, day, time);
  const early = moonSign(year, month, day, "00:00");
  const late = moonSign(year, month, day, "23:59");
  return { ...sign, certain: Boolean(time) || early.name === late.name, early: early.name, late: late.name };
}

export function lifePathNumber(year: number, month: number, day: number) {
  const reduce = (n: number) => {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split("").reduce((a, b) => a + Number(b), 0);
    return n;
  };
  return reduce(reduce(month) + reduce(day) + reduce(year));
}

export function isValidDate(year: number, month: number, day: number) {
  if (![year, month, day].every(Number.isInteger)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/* ---------- quiz content shared by the client and the server ---------- */
/* ---------- quiz definitions (v3: love & the other person) ---------- */

export type Option = readonly [emoji: string, label: string];
export type Question = { q: string; sub?: string; opts: readonly Option[]; multi?: boolean; grid?: boolean };

export const SIGN_UNKNOWN = "I don't know their sign";

export const QUESTIONS = {
  gender: { q: "Select your gender", sub: "So your reading speaks to you.", grid: true,
    opts: [["♀", "Female"], ["♂", "Male"], ["⚧", "Non-binary"], ["✦", "Prefer not to say"]] },
  drawn_to: { q: "Who are you drawn to?", opts: [["👨", "Men"], ["👩", "Women"], ["💞", "Both"]] },
  someone: { q: "Who's on your mind right now?", sub: "Be honest. Nobody else will see this.",
    opts: [["💑", "My partner"], ["💬", "Someone I'm talking to"], ["🙈", "Someone I like"], ["🔙", "My ex"], ["🌙", "No one right now"]] },
  their_sign: { q: "What's their zodiac sign?", sub: "We'll check how your two signs fit together.", grid: true,
    opts: [["♈", "Aries"], ["♉", "Taurus"], ["♊", "Gemini"], ["♋", "Cancer"], ["♌", "Leo"], ["♍", "Virgo"], ["♎", "Libra"], ["♏", "Scorpio"], ["♐", "Sagittarius"], ["♑", "Capricorn"], ["♒", "Aquarius"], ["♓", "Pisces"], ["❔", SIGN_UNKNOWN]] },
  falls_for: { q: "What makes you fall for someone?", sub: "Choose all that apply.", multi: true,
    opts: [["🤗", "Kindness"], ["😂", "A great sense of humor"], ["🚀", "Ambition"], ["🌙", "A little mystery"], ["🛡️", "Feeling protected"], ["🧠", "Deep conversations"], ["😎", "Confidence"], ["💘", "Loyalty"]] },
  fear: { q: "What scares you most in love?", sub: "Choose all that apply.", multi: true,
    opts: [["🚪", "Being left"], ["⚖️", "Loving more than I'm loved"], ["🥀", "Not being chosen"], ["💔", "Being cheated on"], ["🪞", "Losing myself"], ["🎢", "Mixed signals"]] },
  past: { q: "Why didn't your past relationships work out?", sub: "Choose all that apply.", multi: true,
    opts: [["🔇", "We stopped communicating"], ["🙄", "They weren't serious"], ["🎁", "I gave too much"], ["⏳", "Bad timing"], ["🔓", "Trust broke down"], ["🌱", "I haven't had a serious one yet"]] },
  when_like: { q: "When you like someone, you usually…", sub: "This unlocks your love type.",
    opts: [["🧊", "Act like I'm not that interested"], ["📱", "Read their messages again and again"], ["💗", "Put them first right away"], ["👀", "Watch to see if they're consistent"]] },
  their_attitude: { q: "How {are} {they} acting toward you right now?",
    opts: [["☀️", "Warm and consistent"], ["🎢", "Hot and cold"], ["🌫️", "Hard to read"], ["🔕", "We barely talk now"]] },
  their_signals: { q: "What {have} {they} done lately?", sub: "Choose all that apply. Small things say a lot.", multi: true,
    opts: [["📲", "Texts me first"], ["👀", "Watches my stories"], ["🧠", "Remembers small things I said"], ["🔕", "Goes quiet for days"], ["😒", "Gets a little jealous"], ["🔮", "Talks about the future"]] },
  anxious: { q: "What makes you anxious about {them}?", sub: "Choose all that apply.", multi: true,
    opts: [["📵", "They don't reach out first"], ["⌛", "Slow replies"], ["🤷", "Not knowing how they feel"], ["🧩", "We seem too different"], ["👥", "Someone else might be in the picture"], ["🏃", "Things moving too fast"]] },
  loved_how: { q: "How do you want to be loved?",
    opts: [["👑", "Chosen, with no doubt"], ["🏠", "Safe and steady"], ["🔮", "Understood without explaining"], ["🕊️", "Free to be myself"]] },
  love_lang: { q: "What makes you feel loved?", sub: "Choose all that apply.", multi: true,
    opts: [["💌", "Sweet words"], ["⏰", "Time together"], ["🤍", "Touch and closeness"], ["🎁", "Thoughtful gifts"], ["🛠️", "Help without asking"]] },
} satisfies Record<string, Question>;
export type QuestionId = keyof typeof QUESTIONS;

export const LOADING_QUESTIONS = {
  loading_q34: "Do you often feel you love harder than you're loved back?",
  loading_q72: "Have you felt lately that something in your love life is about to change?",
} as const;

export const NO_ONE = "No one right now";
/** The "someone" follow-ups (their sign, how they act) only appear when there is a specific person. "No, not right now" is the v3 label. */
export function hasSomeone(someone: string | undefined) {
  return Boolean(someone) && someone !== NO_ONE && someone !== "No, not right now";
}
/** Questions only asked when there is someone on their mind, and only when there is no one. */
export const SOMEONE_ONLY = ["their_sign", "their_attitude", "their_signals", "anxious"] as const;
export const NO_ONE_ONLY = ["loved_how", "love_lang"] as const;
export function questionApplies(id: string, someone: string | undefined) {
  if ((SOMEONE_ONLY as readonly string[]).includes(id)) return hasSomeone(someone);
  if ((NO_ONE_ONLY as readonly string[]).includes(id)) return !hasSomeone(someone);
  return true;
}

export const ELEMENT: Record<Element, { traits: string[] }> = {
  Fire: { traits: ["Bold", "Passionate", "Magnetic"] },
  Earth: { traits: ["Grounded", "Loyal", "Determined"] },
  Air: { traits: ["Curious", "Witty", "Free-spirited"] },
  Water: { traits: ["Intuitive", "Empathetic", "Deep"] },
};

export const LP_TXT: Record<number, string> = {
  1: "The Leader", 2: "The Peacemaker", 3: "The Communicator", 4: "The Builder", 5: "The Free Spirit", 6: "The Nurturer",
  7: "The Seeker", 8: "The Powerhouse", 9: "The Humanitarian", 11: "The Intuitive (Master Number)", 22: "The Master Builder", 33: "The Master Teacher",
};

// Shown on the Sun reveal: how this element loves, in plain words.
export const SUN_LOVE: Record<Element, string> = {
  Fire: "In love you're all or nothing. You know fast when you like someone, and lukewarm attention feels like rejection to you.",
  Earth: "In love you're slow to trust and impossible to forget. Once you choose someone, you show it every day in what you do.",
  Air: "In love you fall for a mind first. The right conversation can make you feel closer to someone than a year of dates.",
  Water: "In love you feel everything twice as strongly. You notice when someone's tone changes long before they say a word.",
};

/* ---------- pronouns ---------- */

export type Pron = "he" | "she" | "they";
export function pronounFor(drawnTo: string | undefined): Pron {
  return drawnTo === "Men" ? "he" : drawnTo === "Women" ? "she" : "they";
}
const PRON: Record<Pron, Record<string, string>> = {
  he: { they: "he", them: "him", their: "his", "they're": "he's", s: "s", es: "es", are: "is", have: "has", do: "does", "don't": "doesn't" },
  she: { they: "she", them: "her", their: "her", "they're": "she's", s: "s", es: "es", are: "is", have: "has", do: "does", "don't": "doesn't" },
  they: { they: "they", them: "them", their: "their", "they're": "they're", s: "", es: "", are: "are", have: "have", do: "do", "don't": "don't" },
};
/** Fills {they} {them} {their} {they're} {s} {es} {are} {have} {do} {don't}; {They} etc. are capitalised. */
export function fill(text: string, p: Pron) {
  return text.replace(/\{([A-Za-z']+)\}/g, (all, key: string) => {
    const lower = key.toLowerCase();
    const value = PRON[p][lower];
    if (value === undefined) return all;
    return key[0] === key[0].toUpperCase() && key[0] !== key[0].toLowerCase() ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  });
}

/* ---------- love type (from "when you like someone") ---------- */

export const LOVE_TYPE: Record<string, { name: string; glyph: string; line: string; free: string; wins: string; pull: string }> = {
  "Act like I'm not that interested": { name: "The Mystery", glyph: "🌙",
    line: "You feel a lot and show a little. The people who get close to you are the ones patient enough to look twice.",
    free: "You protect your heart by staying cool, so people often don't realise how much you care until it's too late.",
    wins: "Small, steady effort. Big gestures make you pull back; a message that simply checks how your day went pulls you in.",
    pull: "When you play it cool, {they} read{s} it as a no and step{s} back, and then you take {their} step back as proof you were right to hold back." },
  "Read their messages again and again": { name: "The Dreamer", glyph: "💭",
    line: "You love in your head long before you say it out loud. You see what a connection could become, and you hold on to it.",
    free: "You can build a whole future from one good conversation, and you feel the silence in between more than anyone.",
    wins: "Clarity. The partner who says plainly what {they} feel{s} quiets the voice in your head that keeps guessing.",
    pull: "When a reply takes longer than usual, you fill the gap with the worst version, and the extra messages you send to feel sure can make {them} go quiet." },
  "Put them first right away": { name: "The Devoted", glyph: "💗",
    line: "When you love, you give everything. You remember the details, show up first and stay when it gets hard.",
    free: "You show love by giving it, and you often give so much that the other person never learns to give back.",
    wins: "Someone who notices what you do and does it back without being asked. That's the first thing your soulmate does.",
    pull: "When you give before {they've} had a chance to, {they} get{s} comfortable instead of closer, and you start to feel taken for granted." },
  "Watch to see if they're consistent": { name: "The Guardian", glyph: "🛡️",
    line: "You love carefully. You watch what people do, not what they say, and once someone passes, you're the most loyal person they'll ever meet.",
    free: "You test people quietly before you let them in, and most of them never know there was a test.",
    wins: "Consistency over time. The person who is the same on a busy week as on a good one earns your trust faster than any promise.",
    pull: "While you wait for proof, {they} can't tell where {they} stand{s}, so {they} hold{s} back too, and the test never ends." },
};
// {they've} is used above; add it to the pronoun table lazily.
PRON.he["they've"] = "he's"; PRON.she["they've"] = "she's"; PRON.they["they've"] = "they've";

/* ---------- compatibility ---------- */

const DIST_SCORE = [79, 71, 84, 58, 88, 64, 93] as const; // same, 1 apart, sextile, square, trine, quincunx, opposite
export function compatScore(a: Sign, b: Sign) {
  const i = signIndex(a.name), j = signIndex(b.name);
  const dist = Math.min((i - j + 12) % 12, (j - i + 12) % 12);
  return DIST_SCORE[dist] + ((i * 7 + j * 5) % 5) - 2;
}

const PAIR_FREE: Record<string, string> = {
  same: "Two {e} signs understand each other without trying. The danger is that you also share the same blind spot.",
  complement: "{E1} and {E2} feed each other. {They} bring{s} out a side of you that most people never get to see.",
  hard: "{E1} and {E2} feel very different on the inside. The attraction is real, but you each need something the other doesn't naturally give.",
};
export function compatLine(sun: Sign, other: Sign, p: Pron) {
  return fill(PAIR_FREE[pairKind(sun.element, other.element)].replace("{e}", sun.element).replace("{E1}", sun.element).replace("{E2}", other.element), p);
}
function pairKind(a: Element, b: Element) {
  if (a === b) return "same";
  const good = (a === "Fire" && b === "Air") || (a === "Air" && b === "Fire") || (a === "Earth" && b === "Water") || (a === "Water" && b === "Earth");
  return good ? "complement" : "hard";
}

export function matchesFor(sun: Sign) {
  const i = signIndex(sun.name);
  return {
    matches: [
      { sign: ZODIAC[(i + 6) % 12], kind: "opposite" },
      { sign: ZODIAC[(i + 4) % 12], kind: "trine" },
      { sign: ZODIAC[(i + 8) % 12], kind: "trine" },
    ],
    avoid: ZODIAC[(i + 3) % 12],
  };
}

/* ---------- report library ---------- */

const FALL_LINE: Record<string, string> = {
  "Kindness": "You notice how someone treats a waiter before you notice their smile.",
  "A great sense of humor": "If someone can make you laugh on a bad day, you're already halfway gone.",
  "Ambition": "You're drawn to people who are going somewhere, because you are too.",
  "A little mystery": "You like the ones you can't figure out right away, and that's exactly what keeps you guessing.",
  "Feeling protected": "You fall for the person who makes the world feel a little less heavy.",
  "Deep conversations": "One honest 2 a.m. talk does more for you than a month of nice dates.",
  "Confidence": "You fall for people who know what they want, because it lets you relax.",
  "Loyalty": "You don't fall for words. You fall for the person who is still there next week.",
};

const NEED_LINE: Record<Element, string> = {
  Fire: "someone who matches your energy and never makes you ask twice for attention",
  Earth: "someone whose words and actions match, week after week",
  Air: "someone you can talk anything through with, who also gives you room to breathe",
  Water: "someone who notices when you go quiet, and asks why",
};

const SOUL_SIGN_LINE: Record<string, string> = {
  opposite: "Your opposite sign. {They} {have} exactly what you lack, which is why the pull is strong and why being together makes both of you grow.",
};

const ELEMENT_VIBE: Record<Element, string> = {
  Fire: "{They} {have} a bold energy: quick to laugh, quick to act, and impossible to ignore.",
  Earth: "{They} {have} a grounded presence: reliable, a little private, and calm in a crisis.",
  Air: "{They} {have} a curious mind: funny, talkative, and always full of ideas.",
  Water: "{They} {have} a quiet depth: sensitive, intuitive, and very protective of people {they} love{s}.",
};
const LOVED_TXT: Record<string, string> = {
  "Chosen, with no doubt": "{They} won't make you guess. When {they're} in, {they} say{s} it, and {they} show{s} it in public.",
  "Safe and steady": "{They} {are} the same person on a bad day as on a good one. You'll never have to wonder where you stand.",
  "Understood without explaining": "{They} read{s} you well. {They} notice{s} when something is off and ask{s} before you have to say it.",
  "Free to be myself": "{They} won't try to change you. {They} like{s} you most when you're fully yourself.",
};
const LANG_TXT: Record<string, string> = {
  "Sweet words": "Expect the kind of messages you screenshot and keep.",
  "Time together": "{They} protect{s} your time together like it's an appointment that can't be moved.",
  "Touch and closeness": "{They} reach{es} for your hand without thinking about it.",
  "Thoughtful gifts": "{They} remember{s} the small thing you mentioned once, and bring{s} it home.",
  "Help without asking": "{They} fix{es} the thing you were dreading before you even ask.",
};
const SEES_YOU: Record<Element, string> = {
  Fire: "A {sign} notices your energy first. To {them}, you feel like a challenge worth winning, and {they} like{s} that you don't make it easy.",
  Earth: "A {sign} notices whether you are reliable. To {them}, the small things you do say more than anything you could promise.",
  Air: "A {sign} notices your mind first. To {them}, a good conversation with you is the highlight of the day.",
  Water: "A {sign} notices how you make {them} feel. To {them}, you are either completely safe or a risk, and {they} decide{s} quickly.",
};
const ATTITUDE_TXT: Record<string, string> = {
  "Warm and consistent": "{They're} warm because {they} feel{s} safe with you. That's the best sign there is. The next step is to say what you want out loud.",
  "Hot and cold": "Hot and cold usually means {they} like{s} you but feel{s} unsure about getting closer. The cold days are about {their} fear, not your worth.",
  "Hard to read": "When {they're} hard to read, {they're} usually waiting for a clear sign from you before taking a risk. You may be waiting for the same thing.",
  "We barely talk now": "The distance doesn't mean the feeling is gone. Your signs often go quiet when something feels unfinished.",
};
const COMMIT_TXT: Record<Element, string> = {
  Fire: "What makes a Fire sign commit: feeling admired and never bored. Routine is what makes {them} drift.",
  Earth: "What makes an Earth sign commit: proof over time. {They} decide{s} slowly and then {they} stay{s}.",
  Air: "What makes an Air sign commit: freedom inside the relationship. The tighter you hold on, the further {they} drift{s}.",
  Water: "What makes a Water sign commit: emotional safety. Once {they} feel{s} safe, {they're} the most loyal sign of all.",
};
const NOTICE_TXT: Record<Element, string> = {
  Fire: "The first thing your soulmate notices is your energy: the way you light up a conversation. It's what makes {them} want to know you.",
  Earth: "The first thing your soulmate notices is how steady you are. In a world that feels rushed, you feel like a place to rest.",
  Air: "The first thing your soulmate notices is how you talk: quick, funny and curious. {They}'ll want to keep you talking.",
  Water: "The first thing your soulmate notices is how you listen. {They}'ll feel understood by you within minutes.",
};

// "What have they done lately?" read back to the user.
const SIGNAL_TXT: Record<string, string> = {
  "Texts me first": "{They} text{s} you first. People don't start conversations with someone they're unsure about. That's not politeness, it's a choice.",
  "Watches my stories": "{They} watch{es} your stories but {don't} always say much. It's the quietest kind of interest: {they} want{s} to know what you're doing without showing how much {they} care{s}.",
  "Remembers small things I said": "{They} remember{s} small things you said. Attention to detail is the hardest thing to fake. You're on {their} mind when you're not around.",
  "Goes quiet for days": "{They} go{es} quiet for days. Silence like this usually means {they're} sorting out a feeling, not that the feeling is gone.",
  "Gets a little jealous": "{They} get{s} a little jealous. Jealousy is the feeling people hide best and fake least. {They} see{s} you as someone {they} could lose.",
  "Talks about the future": "{They} talk{s} about the future. When someone puts you in plans that are months away, {they're} quietly telling you {they} want{s} you there.",
};
// What the other person feels but keeps hidden, by their element.
const HIDE_TXT: Record<Element | "unknown", string> = {
  Fire: "What {they} won't say out loud: {they} need{s} to feel chosen by you, not just liked. When {they} act{s} like {they} {don't} care, {they're} testing whether you'll come closer.",
  Earth: "What {they} won't say out loud: {they're} more attached than {they} show{s}. {They} hold{s} back the words because {they} want{s} to be sure before {they} promise{s} anything.",
  Air: "What {they} won't say out loud: {they} think{s} about you more than {they} admit{s}. {They} keep{s} it light because getting serious feels riskier than it looks.",
  Water: "What {they} won't say out loud: {they} felt something early, and {they're} afraid of being hurt by it. The distance is protection, not a lack of interest.",
  unknown: "What {they} won't say out loud: {they're} less sure of {them}self than {they} look{s}. What reads as distance is often {them} waiting to see if you'll make it safe to come closer.",
};
const YOU_NEED: Record<Element, string> = {
  Fire: "you need passion and quick, clear answers",
  Earth: "you need consistency and plans you can count on",
  Air: "you need freedom and someone you can talk everything through with",
  Water: "you need to feel emotionally safe and noticed",
};
// Subject is "a <sign>", so the verb is always singular.
const THEY_NEED: Record<Element, string> = {
  Fire: "needs excitement and open admiration",
  Earth: "needs calm, routine and proof over time",
  Air: "needs space, lightness and good conversation",
  Water: "needs closeness and reassurance",
};
const CLASH_TXT: Record<"same" | "complement" | "hard", string> = {
  same: "Your clash is a mirror: you react the same way at the same moment, so when things get tense nobody steps back to calm it down.",
  complement: "Your clash isn't about feelings, it's about pace. One of you moves faster, and the other reads the gap as distance.",
  hard: "Your clash is about needs. What makes you feel loved can feel like pressure to {them}, and what {they} give{s} can feel like too little to you.",
};
const CLASH_FIX: Record<"same" | "complement" | "hard", string> = {
  same: "How to fix it: agree that one of you calls a pause when it heats up. Taking turns being the calm one breaks the loop.",
  complement: "How to fix it: say out loud which speed you're at. 'I need a day' and 'I miss you' are both easier to hear than silence.",
  hard: "How to fix it: ask for one small, specific thing instead of the whole feeling. A clear request is something {they} can actually give.",
};
const PAST_FIX: Record<string, string> = {
  "We stopped communicating": "You said your past relationships ended when the talking stopped. With {them}, keep one small daily habit of checking in, even on busy days.",
  "They weren't serious": "You said they weren't serious. With {them}, watch what {they} do{es} over the next few weeks, not what {they} promise{s}, and say what you want early.",
  "I gave too much": "You said you gave too much. With {them}, leave space for {them} to give first. The relationships that last are the ones where both people make an effort.",
  "Bad timing": "You said it was bad timing. With {them}, talk about where your lives are heading before the timing becomes the excuse again.",
  "Trust broke down": "You said trust broke down. With {them}, trust is built in small kept promises, so make few and keep all of them, and expect the same.",
  "I haven't had a serious one yet": "You haven't had a serious relationship yet. With {them}, go slower than your feelings want to. Your first serious love is worth building carefully.",
};
const WRONG_TXT: Record<string, string> = {
  "Act like I'm not that interested": "You play it cool, so the people who stay are the ones who enjoy a chase, and they lose interest once the chase is over. The steady ones read your coolness as a no and leave.",
  "Read their messages again and again": "You fall for what a connection could become, so you can fall for potential and miss what someone is actually showing you right now.",
  "Put them first right away": "You give first and give most, so you attract people who are comfortable taking. The real givers are quieter at the start, and you overlook them.",
  "Watch to see if they're consistent": "You keep people at arm's length while you test them, so the patient ones get tired and the charming ones pass every test with ease.",
};
const WRONG_FIX: Record<string, string> = {
  "Act like I'm not that interested": "What to change: show interest once, clearly. The right person won't need you to play hard to get.",
  "Read their messages again and again": "What to change: judge people by the last three weeks, not by the best conversation you've had.",
  "Put them first right away": "What to change: give a little, then wait. Notice who gives back without being asked.",
  "Watch to see if they're consistent": "What to change: tell people what you need instead of testing them for it. The right one will pass the real test.",
};

const FEAR_TXT: Record<string, string> = {
  "Being left": "You said your biggest fear is being left. So when {they} go{es} quiet, your mind jumps straight to goodbye, even when {they're} only tired.",
  "Loving more than I'm loved": "You said you fear loving more than you're loved. So you count: who texted first, who planned the date. And counting makes love feel like a test.",
  "Not being chosen": "You said you fear not being chosen. So you wait for {them} to choose you clearly, and if {they} hesitate{s}, you quietly start to leave.",
  "Being cheated on": "You said you fear being cheated on. So you watch for signs, and the watching itself can make you feel far apart even when nothing is wrong.",
  "Losing myself": "You said you fear losing yourself. So when things get close, part of you pulls back to protect your space, and {they} feel{s} it.",
  "Mixed signals": "You said mixed signals scare you most. So one cold day can undo a week of warm ones in your head.",
};
const FIX_TXT: Record<Element, string> = {
  Fire: "What to do: say the feeling while it's small. One honest sentence ('I missed you today') does more than waiting for {them} to notice.",
  Earth: "What to do: ask for one specific thing instead of watching for proof. 'Can we keep Sunday for us?' gives {them} a clear way to show up.",
  Air: "What to do: name the pattern lightly, without blame. 'I think we both went quiet' turns a standoff into a conversation.",
  Water: "What to do: let {them} see the feeling before it turns into distance. A soft 'I felt a bit far from you' brings {them} back faster than silence.",
};

const PAST_TXT: Record<string, string> = {
  "We stopped communicating": "You said your past relationships ended when the talking stopped. The sign to avoid is the one that goes silent when things get hard.",
  "They weren't serious": "You said they weren't serious. The sign to avoid is exciting at first and vague about the future.",
  "I gave too much": "You said you gave too much. The sign to avoid is happy to take what you give and slow to give it back.",
  "Bad timing": "You said it was bad timing. The sign to avoid always has a reason why now isn't the moment.",
  "Trust broke down": "You said trust broke down. The sign to avoid keeps part of their life hidden, and calls it privacy.",
  "I haven't had a serious one yet": "You haven't had a serious relationship yet. The sign to avoid is the one you'll be most tempted by first.",
};
const MATCH_TXT: Record<string, string> = {
  opposite: "Your opposite sign: magnetic and balancing.",
  trine: "Same element energy: it feels easy and natural from day one.",
  square: "Intense chemistry, constant friction. Exciting at first, exhausting later.",
};

function an(word: string) {
  return /^[AEIOU]/i.test(word) ? `an ${word}` : `a ${word}`;
}
function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function listOf(items: string[]) {
  const low = items.map((x) => x.toLowerCase());
  if (low.length <= 1) return low[0] ?? "";
  return `${low.slice(0, -1).join(", ")} and ${low[low.length - 1]}`;
}

/* ---------- input parsing ---------- */

export type AstroAnswers = Record<string, string | string[]>;
export type AstroInput = {
  dob: { y: number; m: number; d: number };
  time: string | null;
  place: string;
  goals: string[];
  answers: AstroAnswers;
};

const labels = (q: Question) => q.opts.map(([, label]) => label);

export function parseAstroInput(raw: unknown, now = new Date()): { ok: true; value: AstroInput } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!raw || typeof raw !== "object") return fail("Please complete the quiz first.");
  const body = raw as { dob?: unknown; answers?: unknown };
  const dob = body.dob as { y?: unknown; m?: unknown; d?: unknown } | undefined;
  const y = Number(dob?.y), m = Number(dob?.m), d = Number(dob?.d);
  const year = now.getUTCFullYear();
  if (!isValidDate(y, m, d) || y < year - 100 || y > year - 13) return fail("Please enter a valid date of birth.");
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) return fail("Please complete the quiz first.");
  const source = body.answers as Record<string, unknown>;
  const answers: AstroAnswers = {};
  const someone = typeof source.someone === "string" ? source.someone : undefined;
  for (const [id, value] of Object.entries(source)) {
    if (id in LOADING_QUESTIONS) {
      if (value !== "yes" && value !== "no") return fail("Your answers have changed. Please restart the quiz.");
      answers[id] = value; continue;
    }
    if (!(id in QUESTIONS)) continue; // Ignore unknown keys from older clients.
    if (!questionApplies(id, someone)) continue;
    const q: Question = QUESTIONS[id as QuestionId];
    const allowed = labels(q);
    if (q.multi) {
      if (!Array.isArray(value) || value.length === 0) return fail("Your answers have changed. Please restart the quiz.");
      const picks = [...new Set(value)];
      if (!picks.every((v): v is string => typeof v === "string" && allowed.includes(v))) return fail("Your answers have changed. Please restart the quiz.");
      answers[id] = allowed.filter((label) => picks.includes(label)); // keep option order
    } else {
      if (typeof value !== "string" || !allowed.includes(value)) return fail("Your answers have changed. Please restart the quiz.");
      answers[id] = value;
    }
  }
  const required = (Object.keys(QUESTIONS) as QuestionId[]).filter((id) => questionApplies(id, someone));
  if (required.some((id) => !answers[id])) return fail("Please complete the quiz first.");
  return { ok: true, value: { dob: { y, m, d }, time: null, place: "", goals: ["Love & relationships"], answers } };
}

/* ---------- reading snapshot ---------- */

export type Section = {
  id: string; icon: string; title: string; teaser: string; access: Access; body: string[];
  tag?: string; peek?: string; score?: number; preview?: string[]; unlockedTitle?: string;
};
export type AstroChart = {
  sun: Sign;
  moon: Sign & { certain: boolean; early: string; late: string };
  lifePath: number;
  lifePathTitle: string;
  traits: string[];
};
export type LoveProfile = { type: string; typeGlyph: string; partner?: { name: string; glyph: string; score: number } };
export type AstroSnapshot = {
  kind: "astro";
  version: number;
  test: { id: string; title: string };
  chart: AstroChart;
  profile?: LoveProfile;
  input: AstroInput;
  sections: Section[];
  // Read by the admin dashboard's answer list.
  questions: Array<{ id: string; prompt: string; options: Array<{ label: string }> }>;
  answerChoices: Record<string, number>;
};

export function buildChart(input: Pick<AstroInput, "dob" | "time">): AstroChart {
  const { y, m, d } = input.dob;
  const sun = sunSign(m, d);
  const lifePath = lifePathNumber(y, m, d);
  return { sun, moon: moonForDay(y, m, d, input.time), lifePath, lifePathTitle: LP_TXT[lifePath] ?? "", traits: ELEMENT[sun.element].traits };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export function theirSign(input: AstroInput): Sign | null {
  if (!hasSomeone(one(input.answers.someone))) return null;
  const name = one(input.answers.their_sign);
  return ZODIAC.find((sign) => sign.name === name) ?? null;
}

export function buildSections(chart: AstroChart, input: AstroInput): Section[] {
  const { sun } = chart;
  const a = input.answers;
  const p = pronounFor(one(a.drawn_to));
  const f = (text: string) => fill(text, p);
  const type = LOVE_TYPE[one(a.when_like)];
  const { matches, avoid } = matchesFor(sun);
  const soul = matches[0].sign;
  const partner = theirSign(input);
  const someone = hasSomeone(one(a.someone));
  const fallsFor = many(a.falls_for);
  const fears = many(a.fear);
  const past = many(a.past)[0];

  /* free */
  const typeSection: Section = {
    id: "type", icon: type.glyph, access: "free", title: `Your love type: ${type.name}`,
    tag: `${sun.glyph} ${sun.name} Sun`,
    teaser: type.line,
    body: [type.line, f(type.free)],
  };
  const contrast: Section = {
    id: "contrast", icon: "🔭", access: "free", title: "Who you fall for vs. who you need",
    tag: `You said: ${listOf(fallsFor.slice(0, 3))}`,
    teaser: FALL_LINE[fallsFor[0]] ?? "",
    body: [
      `You fall for ${listOf(fallsFor.slice(0, 3))}. ${FALL_LINE[fallsFor[0]] ?? ""}`.trim(),
      `But your ${sun.name} chart says what actually keeps you calm in love is ${NEED_LINE[soul.element]}. It's not always the person you notice first.`,
    ],
  };
  const compat: Section = partner
    ? {
        id: "compat", icon: "💫", access: "free", title: `You & ${partner.name}: ${compatScore(sun, partner)}% compatible`,
        tag: `${sun.glyph} ${sun.name} + ${partner.glyph} ${partner.name}`,
        score: compatScore(sun, partner),
        teaser: compatLine(sun, partner, p),
        body: [compatLine(sun, partner, p), f("What {they} really feel{s} about you, where you two clash and the moment {they} pull{s} away are in your reading below.")],
      }
    : {
        id: "compat", icon: "💫", access: "free", title: "Your soulmate's sign: 🔒",
        tag: `${compatScore(sun, soul)}% match with your ${sun.name} Sun`,
        score: compatScore(sun, soul),
        teaser: `Your strongest match is ${an(soul.element)} sign, the kind you'd probably overlook at first.`,
        body: [
          `Your strongest match is ${an(soul.element)} sign, the kind you'd probably overlook at first.`,
          someone ? f("Add {their} sign next time to see your exact match. Your soulmate's sign is in your reading below.") : f("Which sign, what {they're} like and how {they}'ll love you are in your Soulmate Profile below."),
        ],
      };

  /* paid sections */
  const attitude = one(a.their_attitude);
  const signals = many(a.their_signals);
  const anxious = many(a.anxious)[0];
  const moment: Section = {
    id: "moment", icon: "🌗", access: "basic", title: f("The moment {they} pull{s} away, and what to do"),
    tag: fears[0] ? `You said you fear: “${fears[0].toLowerCase()}”` : undefined,
    teaser: f(`There's one moment where you two start to drift. It's tied to your love type (${type.name}) and your fear of ${(fears[0] ?? "being left").toLowerCase()}. Your reading names it and tells you what to do.`),
    body: [f(FEAR_TXT[fears[0]] ?? ""), f(type.pull), f(FIX_TXT[sun.element])].filter(Boolean),
    peek: "It usually starts with a small silence…",
  };
  const pattern: Section = {
    id: "pattern", icon: "⭐", access: "full", title: "Your top 3 matches & the sign to avoid",
    tag: "3 matches scored · 1 sign to avoid",
    teaser: `Match #2 is the sign you'd probably overlook. The sign to avoid is one ${sun.name}s fall for again and again${past ? ", and it explains why your past relationships ended the way they did" : ""}.`,
    preview: ["Match #1", "Match #2", "Match #3", "Avoid"],
    body: [
      ...matches.map(({ sign, kind }) => `${sign.glyph} ${sign.name} (${compatScore(sun, sign)}%): ${MATCH_TXT[kind]}`).map((line, n) => `${n + 1}. ${line}`),
      `Be careful with: ${avoid.glyph} ${avoid.name} (${compatScore(sun, avoid)}%). ${MATCH_TXT.square}`,
      past ? f(PAST_TXT[past] ?? "") : "",
      partner ? `Where ${partner.name} stands: ${compatScore(sun, partner)}%, ${matches.some((m) => m.sign.name === partner.name) ? "one of your top 3 matches." : partner.name === avoid.name ? "the sign to be careful with, so go slowly and watch for the pattern above." : "outside your top 3, which means it can work but takes more conscious effort."}` : "",
    ].filter(Boolean),
  };

  if (someone) {
    const kind = partner ? pairKind(sun.element, partner.element) : "hard";
    const who = partner ? an(partner.name) : "";
    const them: Section = {
      id: "them", icon: "💘", access: "basic", title: f("What {they} really feel{s} about you"),
      tag: `${partner ? `${partner.glyph} ${partner.name} · ` : ""}You said: “${attitude.toLowerCase()}”`,
      teaser: f(`{They} may act “${attitude.toLowerCase()}”, but that's not the whole story. Your reading shows what {they} notice{s} first about you, what {they} won't say out loud${signals[0] ? ` and what “${signals[0].toLowerCase()}” really means` : ""}.`),
      preview: ["What {they} notice{s} first", "What {they} hide{s}", "What {their} signals mean", "What makes {them} commit"].map(f),
      body: [
        partner ? f(SEES_YOU[partner.element].replace("A {sign}", cap(an(partner.name)))) : "",
        f(HIDE_TXT[partner?.element ?? "unknown"]),
        f(ATTITUDE_TXT[attitude] ?? ""),
        ...signals.slice(0, 3).map((x) => f(SIGNAL_TXT[x] ?? "")),
      ].filter(Boolean),
      peek: f("What {they} won't say out loud is…"),
    };
    const clash: Section = {
      id: "clash", icon: "⚡", access: "basic", title: partner ? `Where you and ${partner.name} clash` : "Where you two clash",
      tag: anxious ? `You said: “${anxious.toLowerCase()}”` : undefined,
      teaser: f(`Every pair has one spot where it keeps going wrong. For you two it's tied to ${anxious ? `“${anxious.toLowerCase()}”` : "how differently you show love"}. Your reading names it and how to fix it.`),
      body: [
        f(CLASH_TXT[kind]),
        partner ? f(`In short: ${YOU_NEED[sun.element]}, while ${who} ${THEY_NEED[partner.element]}.`) : f(`In short: ${YOU_NEED[sun.element]}. Ask {them} what {they} need{s}, because it's probably not the same.`),
        anxious ? f(`You said this makes you anxious: “${anxious.toLowerCase()}”. That's exactly where this clash shows up first.`) : "",
        f(CLASH_FIX[kind]),
      ].filter(Boolean),
      peek: "It shows up first when…",
    };
    const last: Section = {
      id: "last", icon: "♾️", access: "full", title: partner ? `What makes it last with ${an(partner.name)}` : "What makes it last",
      tag: past ? `You said: “${past.toLowerCase()}”` : undefined,
      teaser: f("The one thing that makes {them} commit, and how to avoid the way your past relationships ended."),
      body: [partner ? f(COMMIT_TXT[partner.element]) : "", past ? f(PAST_FIX[past] ?? "") : "", f(`What keeps you close: ${type.wins}`)].filter(Boolean),
    };
    return [typeSection, contrast, compat, them, clash, moment, last, pattern];
  }

  const loved = one(a.loved_how), lang = many(a.love_lang)[0];
  const soulmate: Section = {
    id: "soulmate", icon: "💞", access: "basic", title: "Your Soulmate Profile",
    tag: `You said: “${loved.toLowerCase()}”`,
    teaser: f("Your soulmate's exact sign, what {they're} like, how {they}'ll love you and what wins you over."),
    preview: ["Sign", "Personality", "How {they} love{s}", "What wins you over"].map(f),
    body: [
      f(`Sign: ${soul.glyph} ${soul.name}. ${SOUL_SIGN_LINE.opposite}`),
      f(`Personality: ${ELEMENT_VIBE[soul.element]}`),
      f(`How {they}'ll love you: ${LOVED_TXT[loved] ?? ""} ${lang ? LANG_TXT[lang] ?? "" : ""}`.trim()),
      f(`What wins you over: ${type.wins}`),
    ],
    peek: f("Your soulmate is the kind of person who…"),
  };
  const wrong: Section = {
    id: "wrong", icon: "🔁", access: "basic", title: "Why you keep attracting the wrong people",
    tag: `Your love type: ${type.name}`,
    teaser: `It's not bad luck. There's one habit tied to your love type (${type.name}) that keeps pulling in the wrong people and pushing away the right ones.`,
    body: [WRONG_TXT[one(a.when_like)] ?? "", past ? f(PAST_TXT[past] ?? "") : "", f(FEAR_TXT[fears[0]] ?? ""), WRONG_FIX[one(a.when_like)] ?? ""].filter(Boolean),
    peek: "It starts the moment you…",
  };
  const notice: Section = {
    id: "them", icon: "💘", access: "basic", title: "What your soulmate will notice first about you",
    tag: `${sun.glyph} ${sun.name} Sun`,
    teaser: f("The first thing that draws {them} to you, and the one thing you do that makes {them} stay."),
    body: [f(NOTICE_TXT[sun.element]), f(COMMIT_TXT[soul.element])],
    peek: f("The first thing your soulmate notices is…"),
  };
  return [typeSection, contrast, compat, soulmate, wrong, notice, pattern, { ...moment, access: "full" }];
}


// Question texts of the v1/v2 quiz, so older readings stay readable in the admin.
const LEGACY_PROMPTS: Record<string, string> = {
  goals: "What do you want to discover?", challenge: "Biggest love challenge (question depends on relationship status)",
  overthink: "How often do you overthink things?", q_drain: "What drains your energy the most?", q_love: "In love, what do you value most?",
  q_others: "How often do you put other people's needs before your own?", q_decide: "When making big decisions, you follow your…",
  yes_compat: "Do you want to know which signs you're most compatible with?", yes_career: "Do you want to discover your hidden talent?",
  st0: "Statement 1 (v2, depends on Sun element)", st1: "Statement 2 (v2, depends on Sun element)", st2: "Statement 3 (v2, depends on Sun element)",
  time: "Birth time", place: "Birth place",
  // v3 questions removed in v4
  status: "What's your relationship status?", future: "What future do you dream of with your person?", want_now: "What do you most want to know right now?",
  looks: "What does your ideal partner look like?", dynamic: "Your ideal relationship feels…", effort: "In relationships, you usually…",
  destiny: "Do you believe there's one person meant for you?",
};
const LEGACY_LOADING: Record<string, string> = {
  loading_q34: "Do you often feel you understand others better than they understand you?",
  loading_q72: "Have you felt like you're at a turning point in life lately?",
};

// Order of questions in the quiz (v3 first, then v2-only ids), used by admin tables.
export const ASTRO_QUESTION_ORDER = [
  "gender", "drawn_to", "someone", "their_sign", "dob", "falls_for", "fear", "past", "when_like",
  "their_attitude", "their_signals", "anxious", "loved_how", "love_lang", "loading_q34", "loading_q72",
  "status", "future", "want_now", "looks", "dynamic", "effort", "destiny",
  "goals", "challenge", "time", "place", "st0", "st1", "st2", "overthink", "q_drain", "q_love", "q_others", "q_decide", "yes_compat", "yes_career",
];

// Readable prompt for an astro question id (admin only). `version` < 3 uses the old loading-question texts.
export function astroQuestionPrompt(id: string, _sunElement?: Element, version = ASTRO_VERSION): string | null {
  if (id in LOADING_QUESTIONS) return version < 3 ? LEGACY_LOADING[id] : LOADING_QUESTIONS[id as keyof typeof LOADING_QUESTIONS];
  if (id in QUESTIONS) return fill(QUESTIONS[id as QuestionId].q, "they");
  if (id === "dob") return "Date of birth";
  return LEGACY_PROMPTS[id] ?? null;
}

function adminQuestions(input: AstroInput, chart: AstroChart, version?: number) {
  const questions: AstroSnapshot["questions"] = [];
  const answerChoices: Record<string, number> = {};
  const push = (id: string, prompt: string, options: string[], value: string | undefined) => {
    const index = value === undefined ? -1 : options.indexOf(value);
    // Answers saved by an older quiz version may not be in today's option list: show them as given.
    if (value !== undefined && index < 0) options = [value];
    questions.push({ id, prompt, options: options.map((label) => ({ label })) });
    if (value !== undefined) answerChoices[id] = Math.max(index, 0);
  };
  const fixed = (id: string, prompt: string, value: string) => push(id, prompt, [value], value);
  const a = input.answers;
  const { sun } = chart;
  fixed("chart", "星盘结果", `${sun.glyph} ${sun.name} Sun · Life Path ${chart.lifePath}`);
  const type = LOVE_TYPE[one(a.when_like)];
  if (type) fixed("love_type", "爱情类型", `${type.glyph} ${type.name}`);
  const partner = theirSign(input);
  if (partner) fixed("partner", "对方星座 / 契合度", `${partner.glyph} ${partner.name} · ${compatScore(sun, partner)}%`);
  if (version !== undefined) fixed("report_version", "报告版本", `v${version}`);
  fixed("dob", "Date of birth", `${input.dob.y}-${String(input.dob.m).padStart(2, "0")}-${String(input.dob.d).padStart(2, "0")}`);
  for (const id of Object.keys(QUESTIONS) as QuestionId[]) {
    const value = a[id];
    if (value === undefined) continue;
    const q: Question = QUESTIONS[id];
    const prompt = fill(q.q, "they");
    if (q.multi) fixed(id, prompt, many(value).join(", "));
    else push(id, prompt, labels(q), one(value));
  }
  for (const id of Object.keys(a)) {
    if (id in QUESTIONS || id in LOADING_QUESTIONS || !LEGACY_PROMPTS[id]) continue;
    fixed(id, LEGACY_PROMPTS[id], many(a[id]).join(", "));
  }
  for (const id of Object.keys(LOADING_QUESTIONS)) if (a[id]) push(id, LOADING_QUESTIONS[id as keyof typeof LOADING_QUESTIONS], ["yes", "no"], one(a[id]));
  return { questions, answerChoices };
}

// Admin answer list from a stored snapshot. v3 is rebuilt; older readings keep their stored list with readable prompts.
export function astroAdminAnswers(snapshot: { input?: AstroInput; chart?: AstroChart; version?: number; questions?: AstroSnapshot["questions"]; answerChoices?: Record<string, number> }) {
  if (!snapshot.input || !snapshot.chart) return null;
  if ((snapshot.version ?? 0) >= 3) return adminQuestions(snapshot.input, snapshot.chart, snapshot.version);
  if (!snapshot.questions || !snapshot.answerChoices) return null;
  const { sun, moon } = snapshot.chart;
  const chartRow = { id: "chart", prompt: "星盘结果", options: [{ label: `${sun.glyph} ${sun.name} Sun · ${moon.glyph} ${moon.name} Moon · Life Path ${snapshot.chart.lifePath}` }] };
  const versionRow = { id: "report_version", prompt: "报告版本", options: [{ label: `v${snapshot.version ?? 1}` }] };
  const questions = [chartRow, versionRow, ...snapshot.questions.filter((q) => q.id !== "chart" && q.id !== "report_version")
    .map((q) => (q.prompt === q.id ? { ...q, prompt: astroQuestionPrompt(q.id, sun.element, snapshot.version ?? 1) ?? q.prompt } : q))];
  return { questions, answerChoices: { ...snapshot.answerChoices, chart: 0, report_version: 0 } };
}

export function buildAstroSnapshot(input: AstroInput): AstroSnapshot {
  const chart = buildChart(input);
  const type = LOVE_TYPE[one(input.answers.when_like)];
  const partner = theirSign(input);
  return {
    kind: "astro", version: ASTRO_VERSION, test: { id: ASTRO_TEST_ID, title: ASTRO_TITLE },
    chart,
    profile: { type: type.name, typeGlyph: type.glyph, ...(partner ? { partner: { name: partner.name, glyph: partner.glyph, score: compatScore(chart.sun, partner) } } : {}) },
    input, sections: buildSections(chart, input), ...adminQuestions(input, chart, ASTRO_VERSION),
  };
}

/* ---------- public projection ---------- */

export type PublicSection = {
  id: string; icon: string; title: string; teaser: string; access: Access; locked: boolean;
  body?: string[]; tag?: string; peek?: string; score?: number; preview?: string[];
};
export type PublicReading = { chart: AstroChart; profile?: LoveProfile; goals: string[]; sections: PublicSection[]; access: Access };

const RANK: Record<Access, number> = { free: 0, basic: 1, full: 2 };
export function canRead(access: Access, required: Access) {
  return RANK[access] >= RANK[required];
}

// Locked sections never include their body, so nothing paid leaks to the browser.
// The love-window title shows the real date only once unlocked.
export function projectReading(snapshot: AstroSnapshot, access: Access): PublicReading {
  return {
    chart: snapshot.chart,
    ...(snapshot.profile ? { profile: snapshot.profile } : {}),
    goals: snapshot.input.goals,
    access,
    sections: snapshot.sections.map((section) => {
      const locked = !canRead(access, section.access);
      const title = !locked && section.unlockedTitle ? section.unlockedTitle : section.title;
      return { id: section.id, icon: section.icon, title, teaser: section.teaser, access: section.access, locked,
        ...(section.tag ? { tag: section.tag } : {}), ...(section.score ? { score: section.score } : {}),
        ...(locked && section.peek ? { peek: section.peek } : {}),
        ...(locked && section.preview ? { preview: section.preview } : {}),
        ...(locked ? {} : { body: section.body }) };
    }),
  };
}
