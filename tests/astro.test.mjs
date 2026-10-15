import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAstroSnapshot, compatScore, fill, lifePathNumber, LOVE_TYPE, moonForDay, parseAstroInput, planForAmount,
  projectReading, PLANS, QUESTIONS, sunSign, ZODIAC,
} from "../lib/astro.ts";

const answers = {
  gender: "Female", drawn_to: "Men", someone: "Someone I'm talking to", their_sign: "Scorpio",
  falls_for: ["A great sense of humor", "A little mystery"], fear: ["Being left", "Mixed signals"], past: ["They weren't serious"],
  when_like: "Read their messages again and again", their_attitude: "Hot and cold",
  their_signals: ["Watches my stories", "Gets a little jealous"], anxious: ["Slow replies"],
  loading_q34: "yes",
};
const raw = { dob: { y: 1995, m: 7, d: 14 }, answers };
const now = new Date("2026-10-14T00:00:00Z");
const snapshotFor = (input) => {
  const parsed = parseAstroInput(input, now);
  assert.ok(parsed.ok, parsed.error);
  return buildAstroSnapshot(parsed.value);
};
const section = (snapshot, id) => snapshot.sections.find((s) => s.id === id);
const { their_sign: _s, their_attitude: _a, their_signals: _g, anxious: _n, ...nobodyBase } = answers;
const nobody = { ...nobodyBase, someone: "No one right now", loved_how: "Chosen, with no doubt", love_lang: ["Time together"] };

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

test("quiz is short: 12 questions with someone, 10 with no one", async () => {
  const { questionApplies } = await import("../lib/astro.ts");
  const count = (someone) => Object.keys(QUESTIONS).filter((id) => questionApplies(id, someone)).length + 1; // + date of birth
  assert.equal(count("My partner"), 12);
  assert.equal(count("No one right now"), 10);
  // The far-fetched promises are gone from the quiz.
  assert.ok(!JSON.stringify(QUESTIONS).match(/look like|meet the one|love window/i));
});

test("input parsing validates answers and conditional questions", () => {
  assert.equal(parseAstroInput(raw, now).ok, true);
  assert.equal(parseAstroInput({ ...raw, dob: { y: 1995, m: 2, d: 30 } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, their_attitude: "Rich" } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, fear: [] } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, fear: ["Spiders"] } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, fear: "Being left" } }, now).ok, false);
  const { their_sign: _x, ...missingSign } = answers;
  assert.equal(parseAstroInput({ ...raw, answers: missingSign }, now).ok, false);
  // With nobody on their mind, the follow-ups are not required and are dropped if sent.
  const parsed = parseAstroInput({ ...raw, answers: { ...nobody, their_sign: "Leo" } }, now);
  assert.ok(parsed.ok);
  assert.equal(parsed.value.answers.their_sign, undefined);
  // The single-only questions are required for no one, and dropped when there is someone.
  const { love_lang: _l, ...noLang } = nobody;
  assert.equal(parseAstroInput({ ...raw, answers: noLang }, now).ok, false);
  const withExtra = parseAstroInput({ ...raw, answers: { ...answers, loved_how: "Safe and steady" } }, now);
  assert.ok(withExtra.ok);
  assert.equal(withExtra.value.answers.loved_how, undefined);
  // Multi answers keep option order and drop duplicates.
  const ordered = parseAstroInput({ ...raw, answers: { ...answers, fear: ["Mixed signals", "Being left", "Mixed signals"] } }, now);
  assert.deepEqual(ordered.value.answers.fear, ["Being left", "Mixed signals"]);
});

test("free cards are about love and the other person; paid cards never leak", () => {
  const snapshot = snapshotFor(raw);
  const free = projectReading(snapshot, "free");
  assert.deepEqual(free.sections.filter((s) => !s.locked).map((s) => s.id), ["type", "contrast", "compat"]);
  assert.equal(free.sections.length, 8);
  assert.ok(free.sections.filter((s) => s.locked).every((s) => s.body === undefined));
  // With someone on their mind, "what they really feel" is the first locked card.
  assert.deepEqual(free.sections.slice(3).map((s) => s.id), ["them", "clash", "moment", "last", "pattern"]);
  assert.match(section(snapshot, "them").title, /What he really feels about you/);
  assert.ok(section(snapshot, "them").body.some((line) => /stories/.test(line)), "signals are read back");
  assert.match(section(snapshot, "compat").title, /You & Scorpio: \d+% compatible/);
  assert.equal(free.profile.partner.name, "Scorpio");
  // Soulmate sign and match names stay hidden on the free page.
  const soul = ZODIAC[(ZODIAC.findIndex((z) => z.name === "Cancer") + 6) % 12].name;
  const freeText = JSON.stringify(free);
  assert.ok(!freeText.includes(soul), "soulmate sign leaked");
  assert.ok(!/love window|where you('ll| will|'re likely to) meet|look like/i.test(JSON.stringify(snapshot.sections)), "far-fetched promise left");
  const full = projectReading(snapshot, "full");
  assert.ok(full.sections.every((s) => !s.locked && s.body.length > 0 && s.preview === undefined && s.peek === undefined));
  assert.deepEqual(projectReading(snapshot, "basic").sections.filter((s) => !s.locked).map((s) => s.id).sort(),
    ["clash", "compat", "contrast", "moment", "them", "type"]);
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
  assert.deepEqual(snapshot.sections.slice(3).map((s) => s.id), ["soulmate", "wrong", "them", "pattern", "moment"]);
  assert.deepEqual(snapshot.sections.filter((s) => s.access === "basic").map((s) => s.id), ["soulmate", "wrong", "them"]);
});

test("someone with an unknown sign still gets the partner reading", () => {
  const snapshot = snapshotFor({ ...raw, answers: { ...answers, someone: "My ex", their_sign: "I don't know their sign" } });
  assert.equal(snapshot.profile.partner, undefined);
  assert.deepEqual(snapshot.sections.slice(3).map((s) => s.id), ["them", "clash", "moment", "last", "pattern"]);
  assert.match(section(snapshot, "clash").title, /Where you two clash/);
});

test("old v3 answers stay readable in the admin", async () => {
  const { astroAdminAnswers } = await import("../lib/astro.ts");
  const snapshot = snapshotFor(raw);
  const v3 = { ...snapshot, version: 3, input: { ...snapshot.input, answers: { ...snapshot.input.answers, someone: "Yes, someone I like", want_now: "Will we last?" } } };
  const { questions, answerChoices } = astroAdminAnswers(v3);
  const label = (id) => questions.find((q) => q.id === id)?.options[answerChoices[id]]?.label;
  assert.equal(label("someone"), "Yes, someone I like");
  assert.equal(label("want_now"), "Will we last?");
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
  assert.equal(byId.report_version.label, "v4");
  assert.match(byId.their_attitude.prompt, /How are they acting/);
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
