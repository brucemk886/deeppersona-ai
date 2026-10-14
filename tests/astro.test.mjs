import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAstroSnapshot, lifePathNumber, moonForDay, parseAstroInput, planForAmount, projectReading, PLANS, sunSign,
} from "../lib/astro.ts";

const answers = {
  gender: "Female", status: "Single", challenge: "I struggle to open up", st0: "That's so me", st1: "Sometimes", st2: "Not really",
  overthink: "Often", q_drain: "Feeling misunderstood", q_love: "Deep conversations", q_others: "Almost always", q_decide: "Gut feeling",
  yes_compat: "yes", loading_q34: "no",
};
const raw = { dob: { y: 1995, m: 7, d: 14 }, time: null, place: "Austin, USA", goals: ["Love & relationships"], answers };
const now = new Date("2026-10-14T00:00:00Z");

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
  // Known reference: full moon on 2000-01-21 had the Moon in Leo/Cancer border; 2000-01-01 noon UTC Moon was in Scorpio.
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
  const parsed = parseAstroInput(raw, now);
  assert.ok(parsed.ok);
  const snapshot = buildAstroSnapshot(parsed.value);
  assert.equal(snapshot.test.title, "Your Cosmic Blueprint");
  assert.equal(snapshot.sections.length, 6);
  const free = projectReading(snapshot, "free");
  assert.deepEqual(free.sections.filter((s) => !s.locked).map((s) => s.id), ["core"]);
  assert.ok(free.sections.filter((s) => s.locked).every((s) => s.body === undefined));
  assert.deepEqual(projectReading(snapshot, "basic").sections.filter((s) => !s.locked).map((s) => s.id), ["core", "love"]);
  assert.ok(projectReading(snapshot, "full").sections.every((s) => !s.locked && s.body.length > 0));
  // Admin answer view needs questions + answerChoices.
  assert.ok(Array.isArray(snapshot.questions) && snapshot.answerChoices.gender === 0);
});

test("plans map to fixed prices", () => {
  assert.equal(PLANS.basic.cents, 499);
  assert.equal(PLANS.full.cents, 999);
  assert.equal(planForAmount(499), "basic");
  assert.equal(planForAmount(999), "full");
  assert.equal(planForAmount(1999), null);
});
