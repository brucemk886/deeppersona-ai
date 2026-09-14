import assert from "node:assert/strict";
import test from "node:test";
import { buildAiReadingPrompt, mergeAiReadings, parseAiReading } from "../lib/ai-reading-parse.ts";

const questions = [{
  id: "attachment-style-v3-q01",
  testId: "attachment-style",
  kicker: "First reaction",
  prompt: "When their texting suddenly goes cold and dry, what hits you first?",
  atlasPath: "",
  position: 1,
  active: true,
  options: [
    { label: "A sinking feeling in my chest: Did I say something wrong?", microcopy: "", meaning: "", projection: "", styleKey: "anxious" },
  ],
}];

test("parseAiReading accepts fenced JSON and ignores unknown question ids", () => {
  const parsed = parseAiReading(`Here you go
\`\`\`json
{"summary":"You reach first.","reflectionPrompt":"What would a calmer hour do?","choices":[{"questionId":"attachment-style-v3-q01","reading":"The dry texts land as a threat to the bond."},{"questionId":"other","reading":"skip me"}]}
\`\`\``, ["attachment-style-v3-q01"]);
  assert.deepEqual(parsed, {
    summary: "You reach first.",
    reflectionPrompt: "What would a calmer hour do?",
    choices: [{ questionId: "attachment-style-v3-q01", reading: "The dry texts land as a threat to the bond." }],
  });
});

test("parseAiReading rejects missing summary or empty choices", () => {
  assert.equal(parseAiReading('{"summary":"","choices":[{"questionId":"q1","reading":"ok"}]}'), null);
  assert.equal(parseAiReading('{"summary":"ok","choices":[]}'), null);
  assert.equal(parseAiReading("not json"), null);
});

test("buildAiReadingPrompt lists only the selected option wording", () => {
  const built = buildAiReadingPrompt(
    { id: "attachment-style", title: "Attachment Style Quiz" },
    questions,
    { "attachment-style-v3-q01": 0 },
    { title: "Anxious-Preoccupied", summary: "You move toward the bond." },
  );
  assert.deepEqual(built.questionIds, ["attachment-style-v3-q01"]);
  assert.match(built.user, /Did I say something wrong/);
  assert.match(built.user, /Include every questionId/);
  assert.doesNotMatch(built.user, /PRIVATE_ADMIN_MEANING/);
});

test("mergeAiReadings fills missing question ids without dropping the summary", () => {
  const merged = mergeAiReadings(
    { summary: "You reach first.", choices: [{ questionId: "q1", reading: "first" }] },
    { summary: "", choices: [{ questionId: "q2", reading: "second" }] },
    ["q1", "q2"],
  );
  assert.deepEqual(merged, {
    summary: "You reach first.",
    choices: [
      { questionId: "q1", reading: "first" },
      { questionId: "q2", reading: "second" },
    ],
  });
  assert.deepEqual(parseAiReading('{"summary":"","choices":[{"questionId":"q2","reading":"second"}]}', ["q2"], { requireSummary: false })?.choices, [
    { questionId: "q2", reading: "second" },
  ]);
});
