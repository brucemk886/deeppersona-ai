import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  attachmentPlotPosition,
  buildAttachmentResult,
  chartAxisPercent,
  classifyAttachment,
  intensityLabel,
  plotVisualQuadrant,
  scoreAttachment,
  scoreAttachmentSubset,
  scoreOnSeven,
  STYLE_DIMENSIONS,
} from "../lib/attachment.ts";
import { ATTACHMENT_V12_BANK, relationshipQuestions } from '../lib/relationship-content.ts';
import { PUBLIC_QUESTION_IDS } from '../lib/public-catalog.ts';
import { normalizePresentationMode, showsOptionImages } from '../lib/quiz.ts';

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

test("attachment quiz uses the V1.2 English text bank", () => {
  assert.equal(relationshipQuestions.length, ATTACHMENT_V12_BANK.length);
  assert.equal(relationshipQuestions.length, 20);
  relationshipQuestions.forEach((question, index) => {
    const item = ATTACHMENT_V12_BANK[index];
    assert.equal(question.prompt, item.prompt);
    assert.deepEqual(question.options.map((option) => option.label), [item.anxious, item.avoidant, item.secure, item.fearful]);
    assert.deepEqual(question.options.map((option) => option.microcopy), ["", "", "", ""]);
    assert.equal(question.atlasPath, "");
    assert.equal(question.kicker, "First reaction");
  });
  assert.match(relationshipQuestions[0].prompt, /When their texting suddenly goes cold and dry/);
  assert.match(relationshipQuestions[0].options[0].label, /Did I say something wrong/);
  assert.doesNotMatch(relationshipQuestions.map((question) => question.prompt).join("\n"), /weekend together|new town|cinema|text shows Read/i);
});

test("public catalog contains twenty distinct text questions and no canned readings", async () => {
  const catalog = await readFile(new URL("../lib/quiz-content.ts", import.meta.url), "utf8");
  const live = catalog.slice(0, catalog.indexOf("RETIRED_QUESTION_PROMPTS"));
  assert.equal(relationshipQuestions.length, 20);
  assert.equal(new Set(relationshipQuestions.map(q => q.id)).size, 20);
  assert.deepEqual(new Set(relationshipQuestions.map(q => q.id)), PUBLIC_QUESTION_IDS);
  assert.equal(new Set(relationshipQuestions.flatMap(q => q.options.map(o => o.label))).size, 80);
  assert.deepEqual(relationshipQuestions.map(q => q.kicker), Array(20).fill("First reaction"));
  for (const q of relationshipQuestions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.every(o=>o.label.length>4 && o.readingFocus && o.styleKey && !o.meaning && !o.projection && !o.microcopy));
    assert.deepEqual(q.options.map(o => o.styleKey), ["anxious", "avoidant", "secure", "fearful"]);
    assert.equal(q.atlasPath, "");
  }
  assert.match(catalog, /presentationMode: "text"/);
  assert.match(catalog, /Attachment Style Quiz: 20 Real First-Reaction Moments/);
  assert.match(catalog, /Don't pick the polished, mature answer/);
  assert.equal((catalog.match(/presentationMode: "image"/g) ?? []).length, 7);
  assert.doesNotMatch(live, /They suddenly go quiet/);
  assert.doesNotMatch(live, /Which room feels safest to share/);
  assert.doesNotMatch(live, /Move toward it/);
  assert.doesNotMatch(catalog, /id: "attachment-style-1"/);
  assert.match(catalog, /RETIRED_QUESTION_PROMPTS/);
  assert.doesNotMatch(live, /scene:/);
});

test("presentationMode keeps image quizzes available", () => {
  assert.equal(normalizePresentationMode("text"), "text");
  assert.equal(normalizePresentationMode("image"), "image");
  assert.equal(normalizePresentationMode(undefined), "image");
  assert.equal(showsOptionImages({ presentationMode: "text" }, "/quiz/relationship-v7/q01.webp"), false);
  assert.equal(showsOptionImages({ presentationMode: "image" }, ""), false);
  assert.equal(showsOptionImages({ presentationMode: "image" }, "/quiz/doors.png"), true);
  const imageFixture = {
    id: "image-fixture",
    atlasPath: "scene:phone",
    options: questions[0].options,
  };
  assert.equal(showsOptionImages({ presentationMode: "image" }, imageFixture.atlasPath), true);
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
  assert.deepEqual(relationshipQuestions.map((q) => q.kicker), Array(20).fill("First reaction"));
});

test("relationship text choices map onto the four attachment styles", () => {
  const pick = (index) => Object.fromEntries(relationshipQuestions.map((question) => [question.id, index]));
  assert.equal(scoreAttachment(relationshipQuestions, pick(0)).style, "anxious");
  assert.equal(scoreAttachment(relationshipQuestions, pick(1)).style, "avoidant");
  assert.equal(scoreAttachment(relationshipQuestions, pick(2)).style, "secure");
  assert.equal(scoreAttachment(relationshipQuestions, pick(3)).style, "fearful");
  const mixed = Object.fromEntries(relationshipQuestions.map((question, index) => [question.id, index % 2]));
  assert.equal(scoreAttachment(relationshipQuestions, mixed).style, "fearful");
  const reading = buildAttachmentResult(relationshipQuestions, pick(0));
  assert.equal(reading.title, "Anxious-Preoccupied");
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
  assert.equal(anxious.title, "Anxious-Preoccupied");
  assert.ok((anxious.anxiety ?? 0) > (anxious.avoidance ?? 0));
});

test("a 7-anxious / 5-avoidant mix scores 45 / 35 and still plots anxious", () => {
  const indexes = [...Array(7).fill(0), ...Array(5).fill(1), ...Array(4).fill(2), ...Array(4).fill(3)];
  const choices = Object.fromEntries(relationshipQuestions.map((question, index) => [question.id, indexes[index]]));
  const scored = scoreAttachment(relationshipQuestions, choices);
  assert.equal(scored.anxiety, 45);
  assert.equal(scored.avoidance, 35);
  assert.equal(scored.style, "anxious");
  assert.equal(plotVisualQuadrant(scored.anxiety, scored.avoidance), "anxious");
});

test("45 anxiety / 35 avoidance is anxious and plots in the top-left cell", () => {
  assert.equal(classifyAttachment(45, 35), "anxious");
  assert.equal(plotVisualQuadrant(45, 35), "anxious");
  const plot = attachmentPlotPosition(45, 35);
  assert.ok(plot.topPercent < 50, `anxiety 45 must sit above the midline, got top=${plot.topPercent}`);
  assert.ok(plot.leftPercent < 50, `avoidance 35 must sit left of the midline, got left=${plot.leftPercent}`);
  assert.equal(chartAxisPercent(44) < 50, true);
  assert.equal(chartAxisPercent(45) > 50, true);
  assert.equal(classifyAttachment(44, 35), "secure");
  assert.equal(plotVisualQuadrant(44, 35), "secure");
  assert.equal(plotVisualQuadrant(45, 45), "fearful");
  assert.equal(plotVisualQuadrant(35, 45), "avoidant");
  assert.equal(plotVisualQuadrant(0, 0), "secure");
  assert.equal(plotVisualQuadrant(100, 100), "fearful");
});

test("how-you-scored uses a 0-7 scale with Low to Very High labels", () => {
  assert.equal(scoreOnSeven(0), 0);
  assert.equal(scoreOnSeven(50), 3.5);
  assert.equal(scoreOnSeven(100), 7);
  assert.equal(intensityLabel(20), "Low");
  assert.equal(intensityLabel(45), "Medium");
  assert.equal(intensityLabel(60), "High");
  assert.equal(intensityLabel(80), "Very High");
});

test("V1.2 has no childhood subset, so caregiver scoring stays unanswered", () => {
  const anxious = Object.fromEntries(relationshipQuestions.map((question) => [question.id, 0]));
  const childhoodAnxious = scoreAttachmentSubset(relationshipQuestions, anxious, "Childhood");
  const overall = scoreAttachment(relationshipQuestions, anxious);
  assert.equal(childhoodAnxious.answered, 0);
  assert.equal(overall.answered, 20);
  assert.equal(overall.style, "anxious");
});

test("majority vote surfaces a secondary style on ties", () => {
  const indexes = [...Array(10).fill(0), ...Array(10).fill(1)];
  const choices = Object.fromEntries(relationshipQuestions.map((question, index) => [question.id, indexes[index]]));
  const scored = scoreAttachment(relationshipQuestions, choices);
  assert.equal(scored.dualHigh, true);
  assert.ok(scored.secondary);
  assert.notEqual(scored.secondary, scored.style);
  const result = buildAttachmentResult(relationshipQuestions, choices);
  assert.equal(result.dualHigh, true);
  assert.ok(result.secondaryKey);
});

test("paywall does not list canned inclusions or invented multi-context scores", async () => {
  const report = await readFile(new URL("../lib/attachment-report.ts", import.meta.url), "utf8");
  const preview = await readFile(new URL("../lib/report-preview.ts", import.meta.url), "utf8");
  const quiz = await readFile(new URL("../app/_components/free-attachment-results.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(report, /底层自相矛盾画像|三大高频暴击分镜|急救刹车与沟通话术/);
  assert.doesNotMatch(report + quiz, /7天脱敏|7-day practice/);
  assert.doesNotMatch(quiz, /report-inclusions/);
  assert.match(preview, /romanceEssay\(snapshot.questions/);
  assert.match(preview, /sample: undefined/);
  assert.doesNotMatch(preview, /publicAttachmentModules|modulesReading/);
  assert.doesNotMatch(preview + quiz, /aiInsightV2|patternName|The 2am Pull-Back/);
  assert.match(report, /not blame statements about caregivers/);
  assert.match(report, /In one scene you chose/);
  assert.doesNotMatch(report + preview + quiz, /Mother \(CG|Father \(CG|AT WORK|millions of users/);
  assert.doesNotMatch(report, /The full self-talk rewrite sits in the paid reading/);
});
