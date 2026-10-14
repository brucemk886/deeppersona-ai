// Astro reading: chart maths, quiz definitions, fixed report library and plan projection.
// Pure module (no runtime imports) so it can run in the Worker, the browser and `node --test`.

export const ASTRO_TEST_ID = "astro-reading";
export const ASTRO_TITLE = "Your Cosmic Blueprint";
export const ASTRO_VERSION = 1;

export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Sign = { name: string; glyph: string; element: Element };
export type PlanId = "basic" | "full";
export type Access = "free" | PlanId;

export const PLANS: Record<PlanId, { cents: number; name: string; blurb: string }> = {
  basic: { cents: 499, name: "Personality Report", blurb: "Core personality + your love pattern" },
  full: { cents: 999, name: "Complete Reading", blurb: "All 5 patterns: love, matches, energy, mind & career" },
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

export type Option = readonly [emoji: string, label: string];
export type Question = { q: string; sub?: string; opts: readonly Option[] };

export const QUESTIONS = {
  gender: { q: "Select your gender", sub: "Used to fine-tune your reading.",
    opts: [["♀", "Female"], ["♂", "Male"], ["⚧", "Non-binary"], ["✦", "Prefer not to say"]] },
  goals: { q: "What do you want to discover?", sub: "Choose as many as you like — it makes your reading more precise.",
    opts: [["💞", "Love & relationships"], ["💼", "Career & money"], ["🪞", "My true personality"], ["🌙", "Life purpose"], ["👥", "Friendships & people"]] },
  status: { q: "What's your relationship status?",
    opts: [["💑", "In a relationship"], ["💍", "Married"], ["🦋", "Single"], ["🌀", "It's complicated"], ["🩹", "Recently broke up"]] },
  challenge_single: { q: "What's been holding you back from finding the right person?", sub: "Your chart can reveal why this pattern shows up.",
    opts: [["🚪", "I attract the wrong people"], ["🧱", "I struggle to open up"], ["⏳", "I'm still healing from the past"], ["🤷", "I'm not sure what I want"]] },
  challenge_couple: { q: "What's the biggest challenge in your relationship right now?", sub: "Your chart can reveal why this pattern shows up.",
    opts: [["💬", "We don't communicate well"], ["🔥", "The spark is fading"], ["🔒", "Trust issues"], ["🧭", "We want different things"], ["🌿", "No real challenges"]] },
  overthink: { q: "How often do you overthink things?",
    opts: [["🌀", "All the time"], ["💭", "Often"], ["🌤️", "Sometimes"], ["😌", "Rarely"]] },
  q_drain: { q: "What drains your energy the most?",
    opts: [["😔", "Feeling misunderstood"], ["🌫️", "Uncertainty about the future"], ["🎭", "Pretending to be someone I'm not"], ["🔁", "Repeating the same mistakes"]] },
  q_love: { q: "In love, what do you value most?",
    opts: [["🔥", "Passion & chemistry"], ["🛡️", "Loyalty & safety"], ["🧠", "Deep conversations"], ["🕊️", "Freedom & space"]] },
  q_others: { q: "How often do you put other people's needs before your own?",
    opts: [["🔄", "Almost always"], ["⚖️", "About half the time"], ["🎯", "Rarely — I know what I want"]] },
  q_decide: { q: "When making big decisions, you follow your…",
    opts: [["❤️", "Heart"], ["🧭", "Head"], ["✨", "Gut feeling"]] },
} satisfies Record<string, Question>;

export const STATEMENT_OPTS: readonly Option[] = [["💯", "That's so me"], ["🤔", "Sometimes"], ["🙅", "Not really"]];
export const LOADING_QUESTIONS = {
  loading_q34: "Do you often feel you understand others better than they understand you?",
  loading_q72: "Have you felt like you're at a turning point in life lately?",
} as const;

export function isSingleStatus(status: string | undefined) {
  return status === "Single" || status === "Recently broke up";
}

export function challengeQuestion(status: string | undefined): Question {
  return isSingleStatus(status) ? QUESTIONS.challenge_single : QUESTIONS.challenge_couple;
}

export const ELEMENT: Record<Element, { traits: string[]; core: string; statements: string[] }> = {
  Fire: { traits: ["Bold", "Passionate", "Magnetic"],
    core: "You carry a natural spark that draws people in. You act on instinct and you're at your best when life feels like an adventure.",
    statements: ["I get bored quickly when things become routine.", "People say I come on strong, but I'm actually softer than I look.", "I'd rather try and fail than never try at all."] },
  Earth: { traits: ["Grounded", "Loyal", "Determined"],
    core: "You're the steady force others lean on. You build things that last — careers, friendships, love.",
    statements: ["I feel guilty when I rest and haven't 'earned' it.", "I show love through actions more than words.", "I need to see proof before I fully trust someone."] },
  Air: { traits: ["Curious", "Witty", "Free-spirited"],
    core: "Your mind never stops moving. You connect ideas and people effortlessly, and conversation is your love language.",
    statements: ["My mind races at night with ideas and 'what ifs'.", "I can talk to anyone, but very few people really know me.", "I lose interest when someone tries to control me."] },
  Water: { traits: ["Intuitive", "Empathetic", "Deep"],
    core: "You feel everything — yours and everyone else's. Your intuition is rarely wrong.",
    statements: ["I often sense how someone feels before they say a word.", "I replay conversations in my head long after they end.", "I give a lot in relationships and sometimes feel it isn't returned."] },
};

export const MOON_TXT: Record<Element, string> = {
  Fire: "Emotionally you need excitement and honesty — you'd rather have a fight than silence.",
  Earth: "Emotionally you need stability — you feel safe when life and love are predictable.",
  Air: "Emotionally you need space and conversation — you process feelings by talking them out.",
  Water: "Emotionally you run deep — you need someone who notices what you don't say.",
};

export const LP_TXT: Record<number, string> = {
  1: "The Leader", 2: "The Peacemaker", 3: "The Communicator", 4: "The Builder", 5: "The Free Spirit", 6: "The Nurturer",
  7: "The Seeker", 8: "The Powerhouse", 9: "The Humanitarian", 11: "The Intuitive (Master Number)", 22: "The Master Builder", 33: "The Master Teacher",
};

export function sunMoonLine(sun: Sign, moon: Sign) {
  if (sun.name === moon.name) return `A double ${moon.name} — what you show is exactly what you feel. That's rare.`;
  if (sun.element === moon.element) return `${sun.name} Sun + ${moon.name} Moon: double ${moon.element.toLowerCase()} energy. You feel as intensely as you act — and people don't always keep up.`;
  return `${sun.name} Sun + ${moon.name} Moon: people see your ${sun.element.toLowerCase()} side first, but inside you're ruled by ${moon.element.toLowerCase()}. This gap explains a lot.`;
}

/* ---------- fixed report library ---------- */

const LOVE_STYLE: Record<Element, string> = {
  Fire: "You fall fast and you fall honestly. When you like someone, you show it — and you expect the same energy back. Slow, lukewarm signals feel like rejection to you, even when they aren't.",
  Earth: "You love with your actions: showing up, remembering details, building something real. You take your time to trust, and once you commit you're all in — which is why careless people hurt you more than they realise.",
  Air: "You're drawn in by the mind first. Banter, ideas and real conversation are how you bond. When the talking stops, you start to drift — not because you stopped caring, but because silence feels like distance.",
  Water: "You love deeply and intuitively. You pick up on moods, read between the lines and give more than you ask for. The risk is that you sense problems long before your partner does — and carry them alone.",
};

const LOVE_NEED: Record<Element, string> = {
  Fire: "Your Moon needs a partner who is direct, playful and brave enough to argue and make up.",
  Earth: "Your Moon needs consistency: someone whose words and actions match, week after week.",
  Air: "Your Moon needs room to breathe and a partner you can talk anything through with.",
  Water: "Your Moon needs emotional safety — someone who notices when you go quiet and asks why.",
};

const CHALLENGE_TXT: Record<string, string> = {
  "I attract the wrong people": "The pattern: you're drawn to intensity and potential, and you give people credit before they've earned it. The shift: judge by what someone does in the first month, not by how they make you feel in the first week.",
  "I struggle to open up": "The pattern: you test people quietly before letting them in, and most never realise there was a test. The shift: share one small, true thing early — it lets the right people step closer.",
  "I'm still healing from the past": "The pattern: part of you is still guarding against an old hurt, so new people get compared to an old story. The shift: name what you actually need now, not what you lacked then.",
  "I'm not sure what I want": "The pattern: your Sun and Moon want different things, so you swing between excitement and safety. The shift: notice which partner made you feel calm and like yourself — that's the real signal.",
  "We don't communicate well": "The pattern: you and your partner process feelings at different speeds, so one of you pushes while the other pulls away. The shift: agree on a time to talk instead of trying to solve it in the moment.",
  "The spark is fading": "The pattern: comfort slowly replaced curiosity. The shift: do something new together — novelty reawakens attraction faster than any deep talk.",
  "Trust issues": "The pattern: when something feels uncertain, your mind fills the gap with the worst version. The shift: ask for the specific reassurance you need, out loud, instead of watching for proof.",
  "We want different things": "The pattern: you've been compromising quietly and keeping score without meaning to. The shift: say what you want in plain words, then decide together what's negotiable and what isn't.",
  "No real challenges": "The pattern to protect: what's working is that you both feel seen. Keep it that way by checking in before small things turn into silence.",
};

const LOVE_VALUE_TXT: Record<string, string> = {
  "Passion & chemistry": "You said passion matters most — for you, attraction is a form of honesty, and you can't fake it.",
  "Loyalty & safety": "You said loyalty matters most — you'd choose someone steady over someone exciting, and that's a strength.",
  "Deep conversations": "You said deep conversation matters most — being understood is how you feel loved.",
  "Freedom & space": "You said freedom matters most — you love best when you don't feel watched or owned.",
};

const MATCH_TXT: Record<string, string> = {
  opposite: "Your opposite sign — magnetic and balancing. They have exactly what you lack, which creates strong chemistry and real growth.",
  trine: "Same element — you understand each other without effort. Easy, natural and deeply comfortable.",
  square: "The sign to be careful with — exciting at first, but you clash on pace and priorities. It can work, but only with a lot of honest talk.",
};

const DRAIN_TXT: Record<string, string> = {
  "Feeling misunderstood": "Being misunderstood drains you because you put real thought into how you come across. When people get you wrong, it feels like your effort was invisible.",
  "Uncertainty about the future": "Uncertainty drains you because your mind keeps running scenarios to protect you. Without a plan, it never gets to rest.",
  "Pretending to be someone I'm not": "Pretending drains you because you have a strong inner self. Every hour you spend adapting to others costs you twice the energy it costs most people.",
  "Repeating the same mistakes": "Repeating patterns drains you because you're self-aware — you see the loop while you're in it, which makes it more frustrating.",
};

const OTHERS_TXT: Record<string, string> = {
  "Almost always": "You also put others first almost every time. That's generous, but it means your own needs get pushed to 'later' — and later rarely comes.",
  "About half the time": "You balance your needs and others' about half the time — healthy, but you probably feel guilty on the days you choose yourself.",
  "Rarely — I know what I want": "You know what you want, which protects your energy. Just watch that people close to you still feel included in your plans.",
};

const RESET_TXT: Record<Element, string> = {
  Fire: "Your fastest reset is movement: a walk, a workout, anything that burns off the restless energy before you decide anything.",
  Earth: "Your fastest reset is your senses: cook something, tidy one space, get outside. Your body calms your mind, not the other way round.",
  Air: "Your fastest reset is getting thoughts out of your head: write them down or talk them through with one person you trust.",
  Water: "Your fastest reset is solitude and water: a shower, a bath, music, an evening alone without explaining yourself.",
};

const OVERTHINK_TXT: Record<string, string> = {
  "All the time": "You told us you overthink all the time. Your mind treats every open question as a danger to solve. It isn't a flaw — it's an over-protective strength.",
  "Often": "You told us you overthink often — especially at night or after social moments. Your mind replays things to make sure you didn't miss anything.",
  "Sometimes": "You overthink sometimes, usually when something really matters to you. Your hidden strength is that you can switch between feeling and logic.",
  "Rarely": "You rarely overthink. Your hidden strength is emotional clarity — you feel it, name it and move on faster than most people.",
};

const DECIDE_TXT: Record<string, string> = {
  "Heart": "You decide with your heart. Your best decisions come when you ask 'which choice would I be proud of?'",
  "Head": "You decide with your head. Your best decisions come when you set a deadline — more analysis past that point only adds doubt.",
  "Gut feeling": "You decide on gut feeling. Your first instinct is usually right; trouble starts when you talk yourself out of it.",
};

const CAREER_TXT: Record<number, string> = {
  1: "Life Path 1 thrives with ownership: leading a project, starting something, being judged on results. You fade in roles where you have to ask permission for everything.",
  2: "Life Path 2 thrives in partnership: coaching, mediation, design, care, any role where reading people is the real skill.",
  3: "Life Path 3 thrives in expression: writing, content, teaching, sales, performance — work where your voice is the product.",
  4: "Life Path 4 thrives in systems: operations, finance, engineering, building something step by step that others rely on.",
  5: "Life Path 5 thrives on variety: travel, media, entrepreneurship, roles that change every week and reward adaptability.",
  6: "Life Path 6 thrives in service: health, education, community, hospitality — work that visibly makes people's lives better.",
  7: "Life Path 7 thrives in depth: research, analysis, strategy, technology, spiritual work — anything that rewards deep thinking.",
  8: "Life Path 8 thrives with scale: business, management, investing, negotiating — you're built to handle money and responsibility.",
  9: "Life Path 9 thrives with meaning: creative work, non-profits, advocacy, any role connected to a bigger cause.",
  11: "Master Number 11 thrives in inspiration: counselling, art, teaching, leading people through change. Your intuition is a professional skill.",
  22: "Master Number 22 thrives in building at scale: you turn big visions into real structures, companies or communities.",
  33: "Master Number 33 thrives in teaching and healing: you lead by caring, and people grow around you.",
};

const ELEMENT_WORK: Record<Element, string> = {
  Fire: "Your Fire Sun adds courage: you do your best work under a bold goal and a short deadline.",
  Earth: "Your Earth Sun adds staying power: you win by being the most reliable person in the room.",
  Air: "Your Air Sun adds ideas: you're at your best connecting people, information and possibilities.",
  Water: "Your Water Sun adds empathy: you understand what people need before they can say it — a rare edge in any career.",
};

/* ---------- input parsing ---------- */

export type AstroAnswers = Record<string, string>;
export type AstroInput = {
  dob: { y: number; m: number; d: number };
  time: string | null;
  place: string;
  goals: string[];
  answers: AstroAnswers;
};

const REQUIRED = ["gender", "status", "challenge", "st0", "st1", "st2", "overthink", "q_drain", "q_love", "q_others", "q_decide"] as const;
const labels = (q: Question) => q.opts.map(([, label]) => label);

function allowedFor(id: string, answers: Record<string, unknown>): string[] | null {
  if (id in QUESTIONS && id !== "goals" && !id.startsWith("challenge_")) return labels(QUESTIONS[id as keyof typeof QUESTIONS]);
  if (id === "challenge") return labels(challengeQuestion(typeof answers.status === "string" ? answers.status : undefined));
  if (/^st[0-2]$/.test(id)) return labels({ q: "", opts: STATEMENT_OPTS });
  if (id === "yes_compat" || id === "yes_career" || id in LOADING_QUESTIONS) return ["yes", "no"];
  return null;
}

export function parseAstroInput(raw: unknown, now = new Date()): { ok: true; value: AstroInput } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!raw || typeof raw !== "object") return fail("Please complete the quiz first.");
  const body = raw as { dob?: unknown; time?: unknown; place?: unknown; goals?: unknown; answers?: unknown };
  const dob = body.dob as { y?: unknown; m?: unknown; d?: unknown } | undefined;
  const y = Number(dob?.y), m = Number(dob?.m), d = Number(dob?.d);
  const year = now.getUTCFullYear();
  if (!isValidDate(y, m, d) || y < year - 100 || y > year - 13) return fail("Please enter a valid date of birth.");
  let time: string | null = null;
  if (body.time !== null && body.time !== undefined && body.time !== "") {
    if (typeof body.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)) return fail("Please enter a valid birth time.");
    time = body.time;
  }
  const place = typeof body.place === "string" ? body.place.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 80) : "";
  const goalOptions = labels(QUESTIONS.goals);
  const goals = Array.isArray(body.goals) ? [...new Set(body.goals.filter((g): g is string => typeof g === "string" && goalOptions.includes(g)))] : [];
  if (goals.length === 0) return fail("Please complete the quiz first.");
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) return fail("Please complete the quiz first.");
  const source = body.answers as Record<string, unknown>;
  const answers: AstroAnswers = {};
  for (const [id, value] of Object.entries(source)) {
    const allowed = allowedFor(id, source);
    if (!allowed) continue; // Ignore unknown keys from older clients.
    if (typeof value !== "string" || !allowed.includes(value)) return fail("Your answers have changed. Please restart the quiz.");
    answers[id] = value;
  }
  if (REQUIRED.some((id) => !answers[id])) return fail("Please complete the quiz first.");
  return { ok: true, value: { dob: { y, m, d }, time, place, goals, answers } };
}

/* ---------- reading snapshot ---------- */

export type Section = { id: string; icon: string; title: string; teaser: string; access: Access; body: string[] };
export type AstroChart = {
  sun: Sign;
  moon: Sign & { certain: boolean; early: string; late: string };
  lifePath: number;
  lifePathTitle: string;
  traits: string[];
};
export type AstroSnapshot = {
  kind: "astro";
  version: number;
  test: { id: string; title: string };
  chart: AstroChart;
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

export function buildSections(chart: AstroChart, input: AstroInput): Section[] {
  const { sun, moon, lifePath, lifePathTitle } = chart;
  const a = input.answers;
  const challenge = a.challenge;
  const hits = ["st0", "st1", "st2"].filter((k) => a[k] && a[k] !== "Not really").length;
  const overthinker = a.overthink === "All the time" || a.overthink === "Often";
  const { matches, avoid } = matchesFor(sun);
  const coreBody = [
    `${ELEMENT[sun.element].core} ${MOON_TXT[moon.element]}`,
    sunMoonLine(sun, moon),
    hits >= 2
      ? `You matched ${hits} of 3 core ${sun.element} traits, so your ${sun.name} Sun is strongly expressed — people meet the real you quickly.`
      : `You matched fewer ${sun.element} traits than most ${sun.name}s, which usually means your ${moon.name} Moon shapes you more than your Sun. People who only know your sign often misread you.`,
  ];
  if (!moon.certain) coreBody.push(`Note: the Moon changed sign on your birth day (${moon.early} early, ${moon.late} later). We used midday, ${moon.name}.`);
  return [
    { id: "core", icon: "🪞", title: "Your core personality", access: "free", teaser: coreBody[0], body: coreBody },
    {
      id: "love", icon: "💞", access: "basic",
      title: challenge && challenge !== "No real challenges" ? `Why “${challenge.toLowerCase()}” keeps happening to you` : "What you really need in love",
      teaser: `With a ${sun.name} Sun and ${moon.name} Moon, your heart and your head want different things. The pattern starts when…`,
      body: [LOVE_STYLE[sun.element], LOVE_NEED[moon.element], CHALLENGE_TXT[challenge] ?? "", LOVE_VALUE_TXT[a.q_love] ?? ""].filter(Boolean),
    },
    {
      id: "matches", icon: "⭐", access: "full", title: "Your top 3 matches (and the sign to avoid)",
      teaser: `Your strongest match balances your ${moon.element.toLowerCase()} Moon. The sign to be careful with is one most ${sun.name}s are drawn to…`,
      body: [
        ...matches.map(({ sign, kind }, n) => `${n + 1}. ${sign.glyph} ${sign.name} — ${MATCH_TXT[kind]}`),
        `Be careful with: ${avoid.glyph} ${avoid.name} — ${MATCH_TXT.square}`,
        `Tip: with a ${moon.name} Moon, the partner who lasts is the one who meets this need — ${LOVE_NEED[moon.element].replace(/^Your Moon needs /, "")}`,
      ],
    },
    {
      id: "energy", icon: "🔋", access: "full", title: `The real reason “${(a.q_drain || "stress").toLowerCase()}” drains you`,
      teaser: `This isn't random — it's tied to your Life Path ${lifePath} and shows up most when…`,
      body: [DRAIN_TXT[a.q_drain] ?? "", OTHERS_TXT[a.q_others] ?? "", RESET_TXT[moon.element]].filter(Boolean),
    },
    {
      id: "mind", icon: "🧠", access: "full", title: overthinker ? "How to stop overthinking (made for your chart)" : "Your hidden emotional strength",
      teaser: `Your ${moon.name} Moon processes feelings in a specific way. The fastest way for you to reset is…`,
      body: [OVERTHINK_TXT[a.overthink] ?? "", RESET_TXT[moon.element], DECIDE_TXT[a.q_decide] ?? ""].filter(Boolean),
    },
    {
      id: "career", icon: "🧭", access: "full", title: "Your hidden talent & best career direction",
      teaser: `Life Path ${lifePath} (${lifePathTitle}) with a ${sun.element} Sun thrives when…`,
      body: [CAREER_TXT[lifePath] ?? "", ELEMENT_WORK[sun.element], DECIDE_TXT[a.q_decide] ?? ""].filter(Boolean),
    },
  ];
}

function adminQuestions(input: AstroInput) {
  const questions: AstroSnapshot["questions"] = [];
  const answerChoices: Record<string, number> = {};
  const push = (id: string, prompt: string, options: string[], value: string | undefined) => {
    const index = value === undefined ? -1 : options.indexOf(value);
    questions.push({ id, prompt, options: options.map((label) => ({ label })) });
    if (index >= 0) answerChoices[id] = index;
  };
  const a = input.answers;
  push("dob", "Date of birth", [`${input.dob.y}-${String(input.dob.m).padStart(2, "0")}-${String(input.dob.d).padStart(2, "0")}`], undefined);
  answerChoices.dob = 0;
  push("time", "Birth time", [input.time ?? "Unknown"], input.time ?? "Unknown");
  push("place", "Birth place", [input.place || "Skipped"], input.place || "Skipped");
  push("goals", QUESTIONS.goals.q, [input.goals.join(", ")], input.goals.join(", "));
  for (const id of ["gender", "status", "overthink", "q_drain", "q_love", "q_others", "q_decide"] as const) push(id, QUESTIONS[id].q, labels(QUESTIONS[id]), a[id]);
  const ch = challengeQuestion(a.status);
  push("challenge", ch.q, labels(ch), a.challenge);
  for (const id of ["st0", "st1", "st2", "yes_compat", "yes_career", ...Object.keys(LOADING_QUESTIONS)]) {
    if (a[id]) push(id, id, id.startsWith("st") ? labels({ q: "", opts: STATEMENT_OPTS }) : ["yes", "no"], a[id]);
  }
  return { questions, answerChoices };
}

export function buildAstroSnapshot(input: AstroInput): AstroSnapshot {
  const chart = buildChart(input);
  return {
    kind: "astro", version: ASTRO_VERSION, test: { id: ASTRO_TEST_ID, title: ASTRO_TITLE },
    chart, input, sections: buildSections(chart, input), ...adminQuestions(input),
  };
}

/* ---------- public projection ---------- */

export type PublicSection = { id: string; icon: string; title: string; teaser: string; access: Access; locked: boolean; body?: string[] };
export type PublicReading = { chart: AstroChart; goals: string[]; sections: PublicSection[]; access: Access };

const RANK: Record<Access, number> = { free: 0, basic: 1, full: 2 };
export function canRead(access: Access, required: Access) {
  return RANK[access] >= RANK[required];
}

// Locked sections never include their body, so nothing paid leaks to the browser.
export function projectReading(snapshot: AstroSnapshot, access: Access): PublicReading {
  return {
    chart: snapshot.chart,
    goals: snapshot.input.goals,
    access,
    sections: snapshot.sections.map((section) => {
      const locked = !canRead(access, section.access);
      return { id: section.id, icon: section.icon, title: section.title, teaser: section.teaser, access: section.access, locked,
        ...(locked ? {} : { body: section.body }) };
    }),
  };
}
