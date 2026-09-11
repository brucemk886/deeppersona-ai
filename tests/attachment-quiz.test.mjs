import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { applyAttachmentStyle, buildAttachmentResult, scoreAttachment, THEME_DIMENSIONS } from "../lib/attachment.ts";
import { relationshipQuestions } from '../lib/relationship-content.ts';
import { buildRelationshipReading } from '../lib/relationship-reading.ts';
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
  for (const q of relationshipQuestions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.every(o=>o.meaning.length>80 && o.readingFocus));
    await readFile(new URL('../public'+q.atlasPath, import.meta.url));
  }
  assert.doesNotMatch(live, /They suddenly go quiet/);
  assert.doesNotMatch(live, /Which room feels safest to share/);
  assert.doesNotMatch(live, /Move toward it/);
  assert.doesNotMatch(catalog, /id: "attachment-style-1"/);
  assert.match(catalog, /RETIRED_QUESTION_PROMPTS/);
  assert.doesNotMatch(live, /scene:/);
});

test('new reading follows selected content rather than A/B/C/D position', () => {
  const choices=Object.fromEntries(relationshipQuestions.map((q,i)=>[q.id,i%4]));
  const reading=buildRelationshipReading(relationshipQuestions,choices);
  const reversed=relationshipQuestions.map(q=>({...q, options:[...q.options].reverse()}));
  const remapped=Object.fromEntries(relationshipQuestions.map(q=>[q.id,3-choices[q.id]]));
  assert.deepEqual(buildRelationshipReading(reversed,remapped),reading);
  assert.equal(reading.result.key,'choices');
  assert.ok(reading.result.themeTitle);
  assert.equal(reading.deepResult.modules.length,5);
  for (const q of relationshipQuestions) assert.ok(reading.deepResult.modules.some(m=>m.explanation.includes(q.options[choices[q.id]].label)));
});

function pickFocus(focus) {
  return Object.fromEntries(relationshipQuestions.map((question) => {
    const index = question.options.findIndex((option) => option.readingFocus === focus);
    return [question.id, index >= 0 ? index : 0];
  }));
}

test("relationship image choices map onto the four attachment styles", () => {
  assert.equal(scoreAttachment(relationshipQuestions, pickFocus("reassurance")).style, "anxious");
  assert.equal(scoreAttachment(relationshipQuestions, pickFocus("space")).style, "avoidant");
  const secureChoices = Object.fromEntries(relationshipQuestions.map((question) => {
    let best = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    question.options.forEach((option, optionIndex) => {
      const dim = THEME_DIMENSIONS[option.readingFocus ?? ""] ?? { anxiety: 2, avoidance: 2 };
      const score = dim.anxiety + dim.avoidance;
      if (score < bestScore) {
        bestScore = score;
        best = optionIndex;
      }
    });
    return [question.id, best];
  }));
  assert.equal(scoreAttachment(relationshipQuestions, secureChoices).style, "secure");
  const mixed = Object.fromEntries(relationshipQuestions.map((question, index) => {
    const focus = index % 2 === 0 ? "presence" : "space";
    const found = question.options.findIndex((option) => option.readingFocus === focus);
    return [question.id, found >= 0 ? found : question.options.findIndex((option) => THEME_DIMENSIONS[option.readingFocus ?? ""]?.[index % 2 === 0 ? "anxiety" : "avoidance"]) || 0];
  }));
  assert.equal(scoreAttachment(relationshipQuestions, mixed).style, "fearful");
  const reading = applyAttachmentStyle(buildRelationshipReading(relationshipQuestions, pickFocus("reassurance")), relationshipQuestions, pickFocus("reassurance"));
  assert.equal(reading.result.title, "Anxious");
  assert.notEqual(reading.result.themeTitle, reading.result.title);
  assert.equal(reading.result.strengths?.length, 3);
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
