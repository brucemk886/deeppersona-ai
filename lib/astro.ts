// Astro reading: chart maths, quiz definitions, fixed report library and plan projection.
// Pure module (no runtime imports) so it can run in the Worker, the browser and `node --test`.

export const ASTRO_TEST_ID = "astro-reading";
export const ASTRO_TITLE = "Your Love Reading";
export const ASTRO_VERSION = 3;

export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Sign = { name: string; glyph: string; element: Element };
export type PlanId = "basic" | "full";
export type Access = "free" | PlanId;

export const PLANS: Record<PlanId, { cents: number; name: string; blurb: string }> = {
  basic: { cents: 499, name: "Soulmate Report", blurb: "Your soulmate profile, how they see you & the moment they pull away" },
  full: { cents: 999, name: "Complete Love Reading", blurb: "Everything + your top 3 matches, the sign to avoid & your next love window" },
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
/* ---------- Venus ingress (low-precision orbital elements, accurate to about a day) ---------- */

const RAD = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;
function kepler(M: number, e: number) {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 5; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/** Geocentric ecliptic longitude of Venus (degrees) at a UTC timestamp. */
export function venusLongitude(ms: number) {
  const d = ms / 864e5 + 2440587.5 - 2451543.5;
  const ws = 282.9404 + 4.70935e-5 * d, es = 0.016709 - 1.151e-9 * d, Ms = norm360(356.047 + 0.9856002585 * d) * RAD;
  const Es = kepler(Ms, es);
  const vs = Math.atan2(Math.sqrt(1 - es * es) * Math.sin(Es), Math.cos(Es) - es);
  const rs = Math.hypot(Math.cos(Es) - es, Math.sqrt(1 - es * es) * Math.sin(Es));
  const xs = rs * Math.cos(vs + ws * RAD), ys = rs * Math.sin(vs + ws * RAD);
  const N = (76.6799 + 2.4659e-5 * d) * RAD, i = (3.3946 + 2.75e-8 * d) * RAD, w = (54.891 + 1.38374e-5 * d) * RAD;
  const a = 0.72333, e = 0.006773 - 1.302e-9 * d, M = norm360(48.0052 + 1.6021302244 * d) * RAD;
  const E = kepler(M, e);
  const x1 = a * (Math.cos(E) - e), y1 = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(y1, x1), r = Math.hypot(x1, y1);
  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  return norm360(Math.atan2(yh + ys, xh + xs) / RAD);
}

const venusSignAt = (ms: number) => Math.floor(venusLongitude(ms) / 30) % 12;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export type LoveWindow = { start: string; end: string; sign: string; kind: "sun" | "partner"; open: boolean };

/** Next period when Venus is in the user's Sun sign or the opposite (partnership) sign. Scans day by day at 12:00 UTC. */
export function nextLoveWindow(sun: Sign, now = new Date()): LoveWindow | null {
  const own = signIndex(sun.name), partner = (own + 6) % 12;
  const day = 864e5;
  const t0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12);
  let startMs: number | null = null, sign = -1;
  const current = venusSignAt(t0);
  const open = current === own || current === partner;
  if (open) { startMs = t0; sign = current; }
  else {
    for (let t = t0 + day; t < t0 + 420 * day; t += day) {
      const s = venusSignAt(t);
      if (s === own || s === partner) { startMs = t; sign = s; break; }
    }
  }
  if (startMs === null) return null;
  let endMs = startMs;
  while (venusSignAt(endMs + day) === sign && endMs < startMs + 160 * day) endMs += day;
  return { start: isoDay(startMs), end: isoDay(endMs), sign: ZODIAC[sign].name, kind: sign === own ? "sun" : "partner", open };
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

/* ---------- quiz definitions (v3: love & the other person) ---------- */

export type Option = readonly [emoji: string, label: string];
export type Question = { q: string; sub?: string; opts: readonly Option[]; multi?: boolean; grid?: boolean };

export const SIGN_UNKNOWN = "I don't know their sign";

export const QUESTIONS = {
  gender: { q: "Select your gender", sub: "So your reading speaks to you.", grid: true,
    opts: [["♀", "Female"], ["♂", "Male"], ["⚧", "Non-binary"], ["✦", "Prefer not to say"]] },
  drawn_to: { q: "Who are you drawn to?", opts: [["👨", "Men"], ["👩", "Women"], ["💞", "Both"]] },
  status: { q: "What's your relationship status?",
    opts: [["🦋", "Single"], ["💬", "Talking to someone"], ["💑", "In a relationship"], ["💍", "Married"], ["🌀", "It's complicated"], ["🩹", "Recently broke up"]] },
  someone: { q: "Is there someone on your mind right now?", sub: "Be honest. Nobody else will see this.",
    opts: [["💘", "Yes, someone I'm with or seeing"], ["🙈", "Yes, someone I like"], ["🔙", "Yes, an ex"], ["🌙", "No, not right now"]] },
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
  love_lang: { q: "What makes you feel loved?", sub: "Choose all that apply.", multi: true,
    opts: [["💌", "Sweet words"], ["⏰", "Time together"], ["🤍", "Touch and closeness"], ["🎁", "Thoughtful gifts"], ["🛠️", "Help without asking"]] },
  future: { q: "What future do you dream of with your person?", sub: "Choose all that apply.", multi: true,
    opts: [["🏡", "A home together"], ["✈️", "Travelling together"], ["👶", "Starting a family"], ["📈", "Building something together"], ["🌿", "A calm, peaceful life"]] },
  want_now: { q: "What do you most want to know right now?",
    opts: [["❓", "Is this person right for me?"], ["🔮", "When will I meet the one?"], ["♾️", "Will we last?"], ["🕊️", "How do I finally move on?"]] },
  their_attitude: { q: "How are they acting toward you right now?",
    opts: [["☀️", "Warm and consistent"], ["🎢", "Hot and cold"], ["🌫️", "Hard to read"], ["🔕", "We barely talk now"]] },
  anxious: { q: "What makes you anxious when you like someone?", sub: "Choose all that apply.", multi: true,
    opts: [["📵", "They don't reach out first"], ["⌛", "Slow replies"], ["🤷", "Not knowing how they feel"], ["🧩", "We seem too different"], ["👥", "Someone else might be in the picture"], ["🏃", "Things moving too fast"]] },
  looks: { q: "What does your ideal partner look like?",
    opts: [["☀️", "Tall and warm"], ["🌸", "Soft and gentle"], ["🖤", "Cool and a little distant"], ["✨", "Looks don't matter much"]] },
  loved_how: { q: "How do you want to be loved?",
    opts: [["👑", "Chosen, with no doubt"], ["🏠", "Safe and steady"], ["🔮", "Understood without explaining"], ["🕊️", "Free to be myself"]] },
  dynamic: { q: "Your ideal relationship feels…",
    opts: [["💖", "Sweet and affectionate"], ["🌿", "Calm and grounded"], ["🎈", "Playful and light"], ["🌍", "Fun and adventurous"]] },
  effort: { q: "In relationships, you usually…",
    opts: [["🎁", "Give more than I get"], ["⚖️", "Feel it's balanced"], ["🧱", "Hold back a little"]] },
  destiny: { q: "Do you believe there's one person meant for you?",
    opts: [["💫", "Yes"], ["🤔", "I half-believe it"], ["🔍", "Not really, but I want to know"]] },
} satisfies Record<string, Question>;
export type QuestionId = keyof typeof QUESTIONS;

export const LOADING_QUESTIONS = {
  loading_q34: "Do you often feel you love harder than you're loved back?",
  loading_q72: "Have you felt lately that something in your love life is about to change?",
} as const;

/** The "someone" follow-ups (their sign, how they act) only appear when there is a specific person. */
export function hasSomeone(someone: string | undefined) {
  return Boolean(someone) && someone !== "No, not right now";
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
    pull: "When you play it cool, {they} read{s} it as a no and step back, and then you take {their} step back as proof you were right to hold back." },
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

const LOOK_TXT: Record<string, string> = {
  "Tall and warm": "Taller than you, with an easy smile and a warmth that makes strangers talk to {them}.",
  "Soft and gentle": "Soft-spoken, with kind eyes and a calm way of moving through a room.",
  "Cool and a little distant": "A little reserved at first, with a sharp, put-together look. Warm only once {they} trust{s} you.",
  "Looks don't matter much": "Not the most obvious person in the room, but the one you keep looking back at.",
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
const MEET_TXT: Record<Element, string> = {
  Fire: "Somewhere active and loud: an event, a trip, a class, a night you almost didn't go out. It starts with a bold first move, often from {them}.",
  Earth: "Through your routine: work, a regular place, a friend of a friend. It starts slowly, and you only realise later that it was the start.",
  Air: "Through conversation: a group chat, an app, a friend's party. It starts with talking for much longer than either of you planned.",
  Water: "In a quiet, unplanned moment: a delay, a small favour, a night that ran late. It starts with a feeling you can't explain.",
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

const WINDOW_WHY: Record<LoveWindow["kind"], string> = {
  sun: "Venus, the planet of love, moves into your own sign. People notice you more, and it's easier to say what you feel.",
  partner: "Venus, the planet of love, moves into your partnership sign. This is when new people arrive and existing bonds get serious.",
};
const WINDOW_STATUS: Record<string, string> = {
  "Is this person right for me?": "If there's someone on your mind, this is when you'll see clearly how {they} show{s} up for you.",
  "When will I meet the one?": "If you're waiting for the right person, say yes to invitations during this window. It's when meetings tend to happen.",
  "Will we last?": "If you're together, this is the best time to talk about the future. Plans made now tend to stick.",
  "How do I finally move on?": "If you're letting go, this is when your heart has the most energy for something new. Old ties feel lighter.",
};

const MASKED_DATE = "••• ••, 20••";

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

const ALWAYS: QuestionId[] = ["gender", "drawn_to", "status", "someone", "falls_for", "fear", "past", "when_like", "love_lang", "future", "want_now", "anxious", "looks", "loved_how", "dynamic", "effort", "destiny"];
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
    if ((id === "their_sign" || id === "their_attitude") && !hasSomeone(someone)) continue;
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
  const required: QuestionId[] = hasSomeone(someone) ? [...ALWAYS, "their_sign", "their_attitude"] : ALWAYS;
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

// Which locked card the user sees first depends on what they most want to know.
const ORDER: Record<string, string[]> = {
  "Is this person right for me?": ["them", "soulmate", "moment", "window", "pattern"],
  "When will I meet the one?": ["soulmate", "window", "them", "moment", "pattern"],
  "Will we last?": ["moment", "them", "window", "soulmate", "pattern"],
  "How do I finally move on?": ["pattern", "moment", "window", "soulmate", "them"],
};

export function buildSections(chart: AstroChart, input: AstroInput, now = new Date()): Section[] {
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
  const loveWin = nextLoveWindow(sun, now);

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
      `But your ${sun.name} chart says what actually keeps you calm in love is ${NEED_LINE[soul.element]}. That's the first thing your soulmate has, and it's not always the person you notice first.`,
    ],
  };
  const pairText = (other: Sign) => compatLine(sun, other, p);
  const compat: Section = partner
    ? {
        id: "compat", icon: "💫", access: "free", title: `You & ${partner.name}: ${compatScore(sun, partner)}% compatible`,
        tag: `${sun.glyph} ${sun.name} + ${partner.glyph} ${partner.name}`,
        score: compatScore(sun, partner),
        teaser: pairText(partner),
        body: [pairText(partner), f("Why it feels this way, what {they} really think{s} of you and the moment {they} pull{s} away are in your reading below.")],
      }
    : {
        id: "compat", icon: "💫", access: "free", title: "Your soulmate's sign: 🔒",
        tag: `${compatScore(sun, soul)}% match with your ${sun.name} Sun`,
        score: compatScore(sun, soul),
        teaser: `Your strongest match is ${an(soul.element)} sign, the kind you'd probably overlook at first.`,
        body: [`Your strongest match is ${an(soul.element)} sign, the kind you'd probably overlook at first.`, f("Which sign, what {they} look{s} like and where you're likely to meet are in your Soulmate Profile below.")],
      };

  /* paid: basic */
  const loved = one(a.loved_how), lang = many(a.love_lang)[0];
  const soulmate: Section = {
    id: "soulmate", icon: "💞", access: "basic", title: "Your Soulmate Profile",
    tag: `You said: “${one(a.looks).toLowerCase()}” · “${loved.toLowerCase()}”`,
    teaser: f(`Your soulmate's sign, what {they} look{s} like, how {they}'ll love you and where you're most likely to meet. ${someone && partner ? `Plus whether ${partner.name} is a match for it.` : ""}`).trim(),
    preview: ["Sign", "Look & vibe", "How {they} love{s}", "Where you'll meet"].map(f),
    body: [
      f(`Sign: ${soul.glyph} ${soul.name}. ${SOUL_SIGN_LINE.opposite}`),
      f(`Look & vibe: ${LOOK_TXT[one(a.looks)] ?? ""} ${ELEMENT_VIBE[soul.element]}`),
      f(`How {they}'ll love you: ${LOVED_TXT[loved] ?? ""} ${lang ? LANG_TXT[lang] ?? "" : ""}`.trim()),
      f(`Where you're likely to meet: ${MEET_TXT[soul.element]}`),
      f(`What wins you over: ${type.wins}`),
      ...(partner ? [partner.name === soul.name
        ? f(`And yes: ${partner.name} is your soulmate sign. The person on your mind fits this profile.`)
        : f(`About ${partner.name}: your soulmate sign is ${soul.name}, but ${partner.name} scores ${compatScore(sun, partner)}% with you. Read “How ${an(partner.name)} sees you” for what that means for the two of you.`)] : []),
    ],
    peek: f("Your soulmate is the kind of person who…"),
  };
  const attitude = one(a.their_attitude);
  const them: Section = partner
    ? {
        id: "them", icon: "💘", access: "basic", title: `How ${an(partner.name)} sees you`,
        tag: `You said: “${attitude.toLowerCase()}”`,
        teaser: f(`What ${an(partner.name)} notices first about you, why {they're} acting “${attitude.toLowerCase()}”, and what makes {them} commit.`),
        body: [f(SEES_YOU[partner.element].replace("A {sign}", cap(an(partner.name)))), f(ATTITUDE_TXT[attitude] ?? ""), f(COMMIT_TXT[partner.element])].filter(Boolean),
        peek: f(`To ${an(partner.name)}, you feel like…`),
      }
    : {
        id: "them", icon: "💘", access: "basic", title: "What your soulmate will notice first about you",
        tag: `${sun.glyph} ${sun.name} Sun`,
        teaser: f("The first thing that draws {them} to you, and the one thing you do that makes {them} stay."),
        body: [f(NOTICE_TXT[sun.element]), f(COMMIT_TXT[soul.element])],
        peek: f("The first thing your soulmate notices is…"),
      };
  const moment: Section = {
    id: "moment", icon: "🌗", access: "basic", title: f("The moment {they} pull{s} away, and what to do"),
    tag: fears[0] ? `You said you fear: “${fears[0].toLowerCase()}”` : undefined,
    teaser: f(`There's one moment where you two start to drift. It's tied to your love type (${type.name}) and your fear of ${(fears[0] ?? "being left").toLowerCase()}. Your reading names it and tells you what to do.`),
    body: [f(FEAR_TXT[fears[0]] ?? ""), f(type.pull), f(FIX_TXT[sun.element])].filter(Boolean),
    peek: "It usually starts with a small silence…",
  };

  /* paid: full */
  const past = many(a.past)[0];
  const pattern: Section = {
    id: "pattern", icon: "⭐", access: "full", title: "Your top 3 matches & the sign you keep falling for",
    tag: "3 matches scored · 1 sign to avoid",
    teaser: `Match #2 is the sign you'd probably overlook. The sign to avoid is one ${sun.name}s fall for again and again${past ? ", and it explains why your past relationships ended the way they did" : ""}.`,
    preview: ["Match #1", "Match #2", "Match #3", "Avoid"],
    body: [
      ...matches.map(({ sign, kind }) => `${sign.glyph} ${sign.name} (${compatScore(sun, sign)}%): ${MATCH_TXT[kind]}`).map((line, n) => `${n + 1}. ${line}`),
      `Be careful with: ${avoid.glyph} ${avoid.name} (${compatScore(sun, avoid)}%). ${MATCH_TXT.square}`,
      past ? f(PAST_TXT[past] ?? "") : "",
    ].filter(Boolean),
  };
  const want = one(a.want_now);
  const windowSection: Section = loveWin
    ? {
        id: "window", icon: "🗓️", access: "full", title: `Your next love window: ${MASKED_DATE}`,
        unlockedTitle: loveWin.open ? `Your love window is open until ${prettyDate(loveWin.end)}` : `Your next love window: ${prettyDate(loveWin.start)}`,
        tag: "Based on the real position of Venus",
        teaser: loveWin.open
          ? "Venus is in a love point of your chart right now. Your reading shows exactly when this window closes and what to do before it does."
          : "Venus is about to move into a love point of your chart. Your reading gives the exact date it opens, when it closes and what to do with it.",
        preview: ["Opens", "Closes", "What to do"],
        body: [
          loveWin.open
            ? `Your love window is open now and lasts until about ${prettyDate(loveWin.end)}. ${WINDOW_WHY[loveWin.kind]}`
            : `Your next love window opens around ${prettyDate(loveWin.start)} and lasts until about ${prettyDate(loveWin.end)}. ${WINDOW_WHY[loveWin.kind]}`,
          f(WINDOW_STATUS[want] ?? WINDOW_STATUS["When will I meet the one?"]),
        ],
      }
    : {
        id: "window", icon: "🗓️", access: "full", title: "Your next love window", tag: "Based on the real position of Venus",
        teaser: "When Venus next lights up your chart, and what to do with it.",
        body: [WINDOW_WHY.partner, f(WINDOW_STATUS[want] ?? WINDOW_STATUS["When will I meet the one?"])],
      };

  const paid: Record<string, Section> = { soulmate, them, moment, pattern, window: windowSection };
  const order = ORDER[want] ?? ORDER["When will I meet the one?"];
  return [typeSection, contrast, compat, ...order.map((id) => paid[id])];
}


// Question texts of the v1/v2 quiz, so older readings stay readable in the admin.
const LEGACY_PROMPTS: Record<string, string> = {
  goals: "What do you want to discover?", challenge: "Biggest love challenge (question depends on relationship status)",
  overthink: "How often do you overthink things?", q_drain: "What drains your energy the most?", q_love: "In love, what do you value most?",
  q_others: "How often do you put other people's needs before your own?", q_decide: "When making big decisions, you follow your…",
  yes_compat: "Do you want to know which signs you're most compatible with?", yes_career: "Do you want to discover your hidden talent?",
  st0: "Statement 1 (v2, depends on Sun element)", st1: "Statement 2 (v2, depends on Sun element)", st2: "Statement 3 (v2, depends on Sun element)",
  time: "Birth time", place: "Birth place",
};
const LEGACY_LOADING: Record<string, string> = {
  loading_q34: "Do you often feel you understand others better than they understand you?",
  loading_q72: "Have you felt like you're at a turning point in life lately?",
};

// Order of questions in the quiz (v3 first, then v2-only ids), used by admin tables.
export const ASTRO_QUESTION_ORDER = [
  "gender", "drawn_to", "status", "someone", "their_sign", "dob", "falls_for", "fear", "past", "when_like", "love_lang", "future", "want_now",
  "their_attitude", "anxious", "looks", "loved_how", "dynamic", "effort", "destiny", "loading_q34", "loading_q72",
  "goals", "challenge", "time", "place", "st0", "st1", "st2", "overthink", "q_drain", "q_love", "q_others", "q_decide", "yes_compat", "yes_career",
];

// Readable prompt for an astro question id (admin only). `version` < 3 uses the old loading-question texts.
export function astroQuestionPrompt(id: string, _sunElement?: Element, version = ASTRO_VERSION): string | null {
  if (id in LOADING_QUESTIONS) return version < 3 ? LEGACY_LOADING[id] : LOADING_QUESTIONS[id as keyof typeof LOADING_QUESTIONS];
  if (id in QUESTIONS) return QUESTIONS[id as QuestionId].q;
  if (id === "dob") return "Date of birth";
  return LEGACY_PROMPTS[id] ?? null;
}

function adminQuestions(input: AstroInput, chart: AstroChart, version?: number) {
  const questions: AstroSnapshot["questions"] = [];
  const answerChoices: Record<string, number> = {};
  const push = (id: string, prompt: string, options: string[], value: string | undefined) => {
    const index = value === undefined ? -1 : options.indexOf(value);
    questions.push({ id, prompt, options: options.map((label) => ({ label })) });
    if (index >= 0) answerChoices[id] = index;
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
    if (q.multi) fixed(id, q.q, many(value).join(", "));
    else push(id, q.q, labels(q), one(value));
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

export function buildAstroSnapshot(input: AstroInput, now = new Date()): AstroSnapshot {
  const chart = buildChart(input);
  const type = LOVE_TYPE[one(input.answers.when_like)];
  const partner = theirSign(input);
  return {
    kind: "astro", version: ASTRO_VERSION, test: { id: ASTRO_TEST_ID, title: ASTRO_TITLE },
    chart,
    profile: { type: type.name, typeGlyph: type.glyph, ...(partner ? { partner: { name: partner.name, glyph: partner.glyph, score: compatScore(chart.sun, partner) } } : {}) },
    input, sections: buildSections(chart, input, now), ...adminQuestions(input, chart, ASTRO_VERSION),
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
