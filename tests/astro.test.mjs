import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAstroSnapshot, compatScore, fill, lifePathNumber, LOVE_TYPE, moonForDay, nextLoveWindow, parseAstroInput, planForAmount,
  projectReading, PLANS, QUESTIONS, sunSign, venusLongitude, ZODIAC,
} from "../lib/astro.ts";

const answers = {
  gender: "Female", drawn_to: "Men", status: "Talking to someone", someone: "Yes, someone I like", their_sign: "Scorpio",
  falls_for: ["A great sense of humor", "A little mystery"], fear: ["Being left", "Mixed signals"], past: ["They weren't serious"],
  when_like: "Read their messages again and again", love_lang: ["Time together"], future: ["A home together", "Travelling together"],
  want_now: "Is this person right for me?", their_attitude: "Hot and cold", anxious: ["Slow replies"],
  looks: "Tall and warm", loved_how: "Chosen, with no doubt", dynamic: "Sweet and affectionate", effort: "Give more than I get", destiny: "Yes",
  loading_q34: "yes",
};
const raw = { dob: { y: 1995, m: 7, d: 14 }, answers };
const now = new Date("2026-10-14T00:00:00Z");
const snapshotFor = (input) => {
  const parsed = parseAstroInput(input, now);
  assert.ok(parsed.ok, parsed.error);
  return buildAstroSnapshot(parsed.value, now);
};
const section = (snapshot, id) => snapshot.sections.find((s) => s.id === id);
const { their_sign: _s, their_attitude: _a, ...nobodyBase } = answers;
const nobody = { ...nobodyBase, someone: "No, not right now", want_now: "When will I meet the one?" };

test("sun sign boundaries", () => {
  assert.equal(sunSign(3, 21).name, "Aries");
  assert.equal(sunSign(3, 20).name, "Pisces");
  assert.equal(sunSign(12, 22).name, "Capricorn");
  assert.equal(sunSign(1, 19).name, "Capricorn");
  assert.equal(sunSign(1, 20).name, "Aquarius");
  assert.equal(sunSign(7, 14).name, "Cancer");
});

test("life path keeps master numbers", () => {
  assert.equal(lifePathNumber(1995, 7, 14), 9); // 7 + 5 + (1+9+9+5=24->6) = 18 -> 9
  assert.equal(lifePathNumber(1992, 11, 9), 5); // 11 + 9 + 3 = 23 -> 5
  assert.equal(lifePathNumber(1991, 11, 9), 22); // 11 + 9 + (1+9+9+1=20->2) = 22, a master number
});

test("moon sign is deterministic and flags sign changes", () => {
  const a = moonForDay(1995, 7, 14, null);
  const b = moonForDay(1995, 7, 14, null);
  assert.deepEqual(a, b);
  assert.equal(typeof a.certain, "boolean");
  assert.equal(moonForDay(1995, 7, 14, "08:30").certain, true);
  // Known reference: 2000-01-01 noon UTC Moon was in Scorpio.
  assert.equal(moonForDay(2000, 1, 1, "12:00").name, "Scorpio");
});

test("quiz has 20 questions, two of them only when there is someone", () => {
  assert.equal(Object.keys(QUESTIONS).length + 1, 20); // + date of birth
  assert.ok(Object.values(QUESTIONS).filter((q) => q.multi).length >= 5);
});

test("input parsing validates answers and conditional questions", () => {
  assert.equal(parseAstroInput(raw, now).ok, true);
  assert.equal(parseAstroInput({ ...raw, dob: { y: 1995, m: 2, d: 30 } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, looks: "Rich" } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, fear: [] } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, fear: ["Spiders"] } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, fear: "Being left" } }, now).ok, false);
  const { their_sign: _x, ...missingSign } = answers;
  assert.equal(parseAstroInput({ ...raw, answers: missingSign }, now).ok, false);
  // With nobody on their mind, the follow-ups are not required and are dropped if sent.
  const parsed = parseAstroInput({ ...raw, answers: { ...nobody, their_sign: "Leo" } }, now);
  assert.ok(parsed.ok);
  assert.equal(parsed.value.answers.their_sign, undefined);
  // Multi answers keep option order and drop duplicates.
  const ordered = parseAstroInput({ ...raw, answers: { ...answers, fear: ["Mixed signals", "Being left", "Mixed signals"] } }, now);
  assert.deepEqual(ordered.value.answers.fear, ["Being left", "Mixed signals"]);
});

test("venus ingress matches published 2025 dates within a day", () => {
  const signAt = (iso) => ZODIAC[Math.floor(venusLongitude(Date.parse(iso)) / 30)].name;
  assert.equal(signAt("2025-10-15T12:00:00Z"), "Libra"); // ingress Oct 13
  assert.equal(signAt("2025-10-12T12:00:00Z"), "Virgo");
  assert.equal(signAt("2025-11-08T12:00:00Z"), "Scorpio"); // ingress Nov 6
  assert.equal(signAt("2025-11-05T12:00:00Z"), "Libra");
  const win = nextLoveWindow(sunSign(7, 14), now); // Cancer: own sign Cancer, partner sign Capricorn
  assert.ok(win && /^\d{4}-\d{2}-\d{2}$/.test(win.start) && win.end >= win.start);
  assert.ok(["Cancer", "Capricorn"].includes(win.sign));
});

test("free cards are about love and the other person; paid cards never leak", () => {
  const snapshot = snapshotFor(raw);
  const free = projectReading(snapshot, "free");
  assert.deepEqual(free.sections.filter((s) => !s.locked).map((s) => s.id), ["type", "contrast", "compat"]);
  assert.equal(free.sections.length, 8);
  assert.ok(free.sections.filter((s) => s.locked).every((s) => s.body === undefined));
  // Order follows "what do you most want to know".
  assert.deepEqual(free.sections.slice(3).map((s) => s.id), ["them", "soulmate", "moment", "window", "pattern"]);
  assert.match(section(snapshot, "compat").title, /You & Scorpio: \d+% compatible/);
  assert.equal(free.profile.partner.name, "Scorpio");
  // Soulmate sign, match names and the love-window date stay hidden on the free page.
  const soul = ZODIAC[(ZODIAC.findIndex((z) => z.name === "Cancer") + 6) % 12].name;
  const freeText = JSON.stringify(free);
  assert.ok(!freeText.includes(soul), "soulmate sign leaked");
  assert.ok(!/20\d\d-\d\d-\d\d|[A-Z][a-z]+ \d{1,2}, 20\d\d/.test(freeText), "date leaked");
  assert.match(free.sections.find((s) => s.id === "window").title, /•••/);
  const full = projectReading(snapshot, "full");
  assert.ok(full.sections.every((s) => !s.locked && s.body.length > 0 && s.preview === undefined && s.peek === undefined));
  assert.ok(!full.sections.find((s) => s.id === "window").title.includes("•"));
  assert.deepEqual(projectReading(snapshot, "basic").sections.filter((s) => !s.locked).map((s) => s.id).sort(),
    ["compat", "contrast", "moment", "soulmate", "them", "type"]);
});

test("pronouns follow who the user is drawn to and no placeholder survives", () => {
  for (const drawn_to of ["Men", "Women", "Both"]) {
    for (const base of [answers, nobody]) {
      for (const when_like of Object.keys(LOVE_TYPE)) {
        const snapshot = snapshotFor({ ...raw, answers: { ...base, drawn_to, when_like } });
        const text = JSON.stringify(snapshot.sections);
        assert.ok(!/\{[A-Za-z']+\}/.test(text), `placeholder left for ${drawn_to}`);
        assert.ok(!/\b(he|she) (are|have|do)\b|\bthey (is|has|does)\b|\bhe're|\bshe're/.test(text), `grammar for ${drawn_to}: ${text.match(/\b(he|she) (are|have|do)\b|\bthey (is|has|does)\b/)?.[0]}`);
        assert.ok(snapshot.sections.every((s) => s.body.every((line) => line.trim().length > 0)));
      }
    }
  }
  assert.equal(fill("{They} pull{s} away from {them}", "she"), "She pulls away from her");
  assert.equal(fill("{They} pull{s} away from {them}", "they"), "They pull away from them");
});

test("nobody on their mind gets a soulmate card instead of a partner card", () => {
  const snapshot = snapshotFor({ ...raw, answers: nobody });
  assert.match(section(snapshot, "compat").title, /soulmate's sign/);
  assert.match(section(snapshot, "them").title, /notice first/);
  assert.equal(snapshot.profile.partner, undefined);
  assert.equal(snapshot.sections[3].id, "soulmate");
});

test("compatibility scores are stable and bounded", () => {
  for (const a of ZODIAC) for (const b of ZODIAC) {
    const score = compatScore(a, b);
    assert.ok(score >= 50 && score <= 96, `${a.name}/${b.name}`);
    assert.equal(score, compatScore(a, b));
  }
});

test("plans map to fixed prices", () => {
  assert.equal(PLANS.basic.cents, 499);
  assert.equal(PLANS.full.cents, 999);
  assert.equal(planForAmount(499), "basic");
  assert.equal(planForAmount(999), "full");
  assert.equal(planForAmount(1999), null);
});


test("admin answer list is readable for v3 and older astro readings", async () => {
  const { astroAdminAnswers, astroQuestionPrompt } = await import("../lib/astro.ts");
  const records = (snap) => { const { questions, answerChoices } = astroAdminAnswers(snap); return questions.map((q) => ({ id: q.id, prompt: q.prompt, label: q.options[answerChoices[q.id]]?.label })); };
  const snapshot = snapshotFor(raw);
  const byId = Object.fromEntries(records(snapshot).map((r) => [r.id, r]));
  assert.match(byId.chart.label, /Sun · Life Path \d+/);
  assert.match(byId.love_type.label, /The Dreamer/);
  assert.match(byId.partner.label, /Scorpio · \d+%/);
  assert.equal(byId.report_version.label, "v3");
  assert.equal(byId.fear.label, "Being left, Mixed signals");
  assert.deepEqual(snapshot.questions.map((q) => q.id), records(snapshot).map((r) => r.id));
  // A stored v2 snapshot keeps its own list.
  const v2 = { version: 2, input: { dob: { y: 1995, m: 7, d: 14 }, answers: { st0: "That's so me" } }, chart: snapshot.chart,
    questions: [{ id: "st0", prompt: "st0", options: [{ label: "That's so me" }] }], answerChoices: { st0: 0 } };
  const old = records(v2);
  assert.equal(old.find((r) => r.id === "report_version").label, "v2");
  assert.match(old.find((r) => r.id === "st0").prompt, /^Statement 1/);
  assert.match(astroQuestionPrompt("loading_q34", undefined, 2), /understand others/);
  assert.match(astroQuestionPrompt("loading_q34"), /love harder/);
});
