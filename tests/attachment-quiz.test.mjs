import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildAttachmentResult, scoreAttachment, STYLE_DIMENSIONS } from "../lib/attachment.ts";
import { relationshipQuestions } from '../lib/relationship-content.ts';
import { PUBLIC_QUESTION_IDS } from '../lib/public-catalog.ts';

const questions = [1, 2, 3, 4].map((position) => ({
  id: `q${position}`,
  testId: "attachment-style",
  kicker: "Scene",
  prompt: `Placeholder scene ${position}`,
  atlasPath: `scene:phone`,
  position,
  active: true,
  options: [
    { label: "A", microcopy: "reach", meaning: "", projection: "" },
    { label: "B", microcopy: "space", meaning: "", projection: "" },
    { label: "C", microcopy: "steady", meaning: "", projection: "" },
    { label: "D", microcopy: "mixed", meaning: "", projection: "" },
  ],
}));

test("public catalog contains twenty distinct image scenarios and eighty interpretations", async () => {
  const catalog = await readFile(new URL("../lib/quiz-content.ts", import.meta.url), "utf8");
  const live = catalog.slice(0, catalog.indexOf("RETIRED_QUESTION_PROMPTS"));
  assert.equal(relationshipQuestions.length, 20);
  assert.equal(new Set(relationshipQuestions.map(q => q.id)).size, 20);
  assert.deepEqual(new Set(relationshipQuestions.map(q => q.id)), PUBLIC_QUESTION_IDS);
  assert.equal(new Set(relationshipQuestions.flatMap(q => q.options.map(o => o.meaning))).size, 80);
  const kickers = relationshipQuestions.map(q => q.kicker);
  assert.deepEqual(kickers.slice(0, 12), Array(12).fill("Romance"));
  assert.deepEqual(kickers.slice(12, 16), Array(4).fill("Self-esteem"));
  assert.deepEqual(kickers.slice(16), Array(4).fill("Childhood"));
  for (const q of relationshipQuestions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.every(o=>o.meaning.length>80 && o.readingFocus && o.styleKey && o.microcopy === o.label));
    assert.deepEqual(q.options.map(o => o.styleKey), ["anxious", "avoidant", "secure", "fearful"]);
    await readFile(new URL('../public'+q.atlasPath, import.meta.url));
  }
  assert.doesNotMatch(live, /They suddenly go quiet/);
  assert.doesNotMatch(live, /Which room feels safest to share/);
  assert.doesNotMatch(live, /Move toward it/);
  assert.doesNotMatch(catalog, /id: "attachment-style-1"/);
  assert.match(catalog, /RETIRED_QUESTION_PROMPTS/);
  assert.doesNotMatch(live, /scene:/);
});

test("selected option labels and style keys travel with the option, not the slot", () => {
  const choices = Object.fromEntries(relationshipQuestions.map((q, i) => [q.id, i % 4]));
  const selected = relationshipQuestions.map((q) => q.options[choices[q.id]]);
  const reversed = relationshipQuestions.map((q) => ({ ...q, options: [...q.options].reverse() }));
  const remapped = Object.fromEntries(relationshipQuestions.map((q) => [q.id, 3 - choices[q.id]]));
  const again = reversed.map((q) => q.options[remapped[q.id]]);
  assert.deepEqual(again.map((option) => option.label), selected.map((option) => option.label));
  assert.deepEqual(again.map((option) => option.styleKey), selected.map((option) => option.styleKey));
  assert.equal(scoreAttachment(relationshipQuestions, choices).style, scoreAttachment(reversed, remapped).style);
  assert.deepEqual(relationshipQuestions.map((q) => q.kicker), [
    ...Array(12).fill("Romance"),
    ...Array(4).fill("Self-esteem"),
    ...Array(4).fill("Childhood"),
  ]);
});

test("relationship image choices map onto the four attachment styles", () => {
  const pick = (index) => Object.fromEntries(relationshipQuestions.map((question) => [question.id, index]));
  assert.equal(scoreAttachment(relationshipQuestions, pick(0)).style, "anxious");
  assert.equal(scoreAttachment(relationshipQuestions, pick(1)).style, "avoidant");
  assert.equal(scoreAttachment(relationshipQuestions, pick(2)).style, "secure");
  assert.equal(scoreAttachment(relationshipQuestions, pick(3)).style, "fearful");
  const mixed = Object.fromEntries(relationshipQuestions.map((question, index) => [question.id, index % 2]));
  assert.equal(scoreAttachment(relationshipQuestions, mixed).style, "fearful");
  const reading = buildAttachmentResult(relationshipQuestions, pick(0));
  assert.equal(reading.title, "Anxious");
  assert.notEqual(reading.themeTitle, reading.title);
  assert.equal(reading.strengths?.length, 3);
  assert.deepEqual(STYLE_DIMENSIONS.fearful, { anxiety: 1, avoidance: 1 });
  const fearful = scoreAttachment(relationshipQuestions, pick(3));
  assert.equal(fearful.anxiety, 50);
  assert.equal(fearful.avoidance, 50);
});

test("attachment scoring maps A/B/C/D onto the four styles", () => {
  const pick = (index) => Object.fromEntries(questions.map((question) => [question.id, index]));
  assert.equal(scoreAttachment(questions, pick(0)).style, "anxious");
  assert.equal(scoreAttachment(questions, pick(1)).style, "avoidant");
  assert.equal(scoreAttachment(questions, pick(2)).style, "secure");
  assert.equal(scoreAttachment(questions, pick(3)).style, "fearful");

  const anxious = buildAttachmentResult(questions, pick(0));
  assert.equal(anxious.key, "anxious");
  assert.equal(anxious.title, "Anxious");
  assert.ok((anxious.anxiety ?? 0) > (anxious.avoidance ?? 0));
});
