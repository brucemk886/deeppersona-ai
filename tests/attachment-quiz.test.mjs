import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildAttachmentResult, scoreAttachment } from "../lib/attachment.ts";

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

test("public catalog is a 12-item attachment image quiz without the old bank", async () => {
  const catalog = await readFile(new URL("../lib/quiz-content.ts", import.meta.url), "utf8");
  const live = catalog.slice(0, catalog.indexOf("RETIRED_QUESTION_PROMPTS"));
  assert.match(catalog, /ATTACHMENT_TEST_ID\}-q/);
  assert.match(catalog, /padStart\(2, "0"\)/);
  assert.match(catalog, /attachmentScenes\.map/);
  assert.doesNotMatch(live, /They suddenly go quiet/);
  assert.doesNotMatch(live, /Which room feels safest to share/);
  assert.doesNotMatch(live, /Move toward it/);
  assert.doesNotMatch(catalog, /id: "attachment-style-1"/);
  assert.match(catalog, /RETIRED_QUESTION_PROMPTS/);
  assert.match(catalog, /scene: "phone"/);
  assert.equal((catalog.match(/scene: "[a-z]+"/g) ?? []).length, 12);
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
