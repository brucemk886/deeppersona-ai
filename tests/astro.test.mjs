import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAstroSnapshot, ELEMENT, lifePathNumber, LOVE_ARCHETYPE, loveElements, moonForDay, parseAstroInput, planForAmount,
  projectReading, PLANS, QUESTIONS, sunMoonLine, sunSign,
} from "../lib/astro.ts";

const answers = {
  gender: "Female", status: "Single", challenge: "I struggle to open up", st0: "That's so me", st1: "Sometimes", st2: "Not really",
  overthink: "Often", q_drain: "Feeling misunderstood", q_love: "Deep conversations", q_others: "Almost always", q_decide: "Gut feeling",
  yes_compat: "yes", loading_q34: "no",
};
const raw = { dob: { y: 1995, m: 7, d: 14 }, time: null, place: "Austin, USA", goals: ["Love & relationships"], answers };
const now = new Date("2026-10-14T00:00:00Z");
const snapshotFor = (input) => {
  const parsed = parseAstroInput(input, now);
  assert.ok(parsed.ok);
  return buildAstroSnapshot(parsed.value);
};
const section = (snapshot, id) => snapshot.sections.find((s) => s.id === id);

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

test("input parsing validates dates and answers", () => {
  assert.equal(parseAstroInput(raw, now).ok, true);
  assert.equal(parseAstroInput({ ...raw, dob: { y: 1995, m: 2, d: 30 } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, dob: { y: 2020, m: 1, d: 1 } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, time: "25:00" }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, q_love: "Money" } }, now).ok, false);
  // A couple's challenge is not valid for a single person.
  assert.equal(parseAstroInput({ ...raw, answers: { ...answers, challenge: "Trust issues" } }, now).ok, false);
  assert.equal(parseAstroInput({ ...raw, goals: [] }, now).ok, false);
  const { gender, ...missing } = answers;
  assert.equal(parseAstroInput({ ...raw, answers: missing }, now).ok, false);
  assert.equal(gender, "Female");
});

test("projection never leaks locked sections", () => {
  const snapshot = snapshotFor(raw);
  assert.equal(snapshot.test.title, "Your Cosmic Blueprint");
  assert.equal(snapshot.sections.length, 9);
  const free = projectReading(snapshot, "free");
  assert.deepEqual(free.sections.filter((s) => !s.locked).map((s) => s.id), ["core", "focus", "match1"]);
  assert.ok(free.sections.filter((s) => s.locked).every((s) => s.body === undefined));
  assert.deepEqual(projectReading(snapshot, "basic").sections.filter((s) => !s.locked).map((s) => s.id), ["core", "focus", "match1", "hidden", "love"]);
  assert.ok(projectReading(snapshot, "full").sections.every((s) => !s.locked && s.body.length > 0));
  // Admin answer view needs questions + answerChoices.
  assert.ok(Array.isArray(snapshot.questions) && snapshot.answerChoices.gender === 0);
});

test("free sections show new content, not lines already seen in the quiz", () => {
  const snapshot = snapshotFor(raw);
  const { sun, moon } = snapshot.chart;
  const freeText = ["core", "focus", "match1"].flatMap((id) => section(snapshot, id).body).join(" ");
  assert.ok(!freeText.includes(sunMoonLine(sun, moon)));
  assert.ok(!freeText.includes(ELEMENT[sun.element].core));
  assert.match(section(snapshot, "focus").title, /love life/);
  // The previewed line is not repeated in the paid section it came from.
  assert.ok(!section(snapshot, "love").body.includes(section(snapshot, "focus").body[0]));
  // The free #1 match is the first of the paid top 3.
  const top = section(snapshot, "matches").body[0].match(/^1\. \S+ (\w+)/)[1];
  assert.equal(section(snapshot, "match1").title, `Your #1 match: ${top[0]}${"•".repeat(Math.max(top.length - 1, 3))}`);
  assert.ok(!["core", "focus", "match1"].some((id) => JSON.stringify(projectReading(snapshot, "free").sections.find((s) => s.id === id)).includes(top)));
});

test("every goal gets a free first look and no section is empty", () => {
  for (const [, goal] of QUESTIONS.goals.opts) {
    const snapshot = snapshotFor({ ...raw, goals: [goal] });
    const focus = section(snapshot, "focus");
    assert.ok(focus && focus.body[0].length > 0, goal);
    assert.ok(snapshot.sections.every((s) => s.body.length > 0), goal);
    const texts = snapshot.sections.flatMap((s) => s.body);
    assert.equal(new Set(texts.filter((t) => !t.startsWith("1. "))).size, texts.filter((t) => !t.startsWith("1. ")).length, `duplicate paragraph for ${goal}`);
  }
});

test("quoted answers keep a capital I", () => {
  const snapshot = snapshotFor(raw);
  assert.match(section(snapshot, "love").title, /“I struggle to open up”/);
  assert.match(section(snapshot, "energy").title, /“feeling misunderstood”/);
});

test("every love answer has a love style", () => {
  for (const [, label] of QUESTIONS.q_love.opts) assert.ok(LOVE_ARCHETYPE[label], label);
  assert.deepEqual(loveElements("Fire"), ["Fire", "Air"]);
  assert.deepEqual(loveElements("Water"), ["Water", "Earth"]);
});

test("plans map to fixed prices", () => {
  assert.equal(PLANS.basic.cents, 499);
  assert.equal(PLANS.full.cents, 999);
  assert.equal(planForAmount(499), "basic");
  assert.equal(planForAmount(999), "full");
  assert.equal(planForAmount(1999), null);
});

test("locked cards use their own hooks and never leak the full body", () => {
  const snapshot = snapshotFor(raw);
  const free = projectReading(snapshot, "free");
  const locked = free.sections.filter((s) => s.locked);
  assert.equal(new Set(locked.map((s) => s.teaser)).size, locked.length);
  for (const s of locked) {
    assert.ok(!s.teaser.endsWith("…"), s.id);
    if (s.peek) assert.ok(s.peek.endsWith("…") && s.peek.length < 90, s.id);
  }
  assert.equal(locked.find((s) => s.id === "matches").peek, undefined);
  assert.ok(!JSON.stringify(free).includes(" a Air ") && !JSON.stringify(free).includes(" a Earth "));
  assert.ok(projectReading(snapshot, "full").sections.every((s) => s.peek === undefined));
});

test("admin answer list is readable for astro readings, including older snapshots", async () => {
  const { astroAdminAnswers } = await import("../lib/astro.ts");
  const records = (snap) => { const { questions, answerChoices } = astroAdminAnswers(snap); return questions.map((q) => ({ id: q.id, prompt: q.prompt, label: q.options[answerChoices[q.id]]?.label })); };
  const snapshot = snapshotFor(raw);
  const byId = Object.fromEntries(records(snapshot).map((r) => [r.id, r]));
  assert.match(byId.chart.label, /Sun · .* Moon.* · Life Path \d+/);
  assert.ok(byId.love_style.label.length > 0);
  assert.equal(byId.report_version.label, "v2");
  assert.match(byId.st0.prompt, /^Do you relate: “/);
  assert.ok(!records(snapshot).some((r) => /^st\d$|^yes_/.test(r.prompt)));
  assert.equal(records({ ...snapshot, version: 1 }).find((r) => r.id === "report_version").label, "v1");
  assert.deepEqual(snapshot.questions.map((q) => q.id), records(snapshot).map((r) => r.id));
});
