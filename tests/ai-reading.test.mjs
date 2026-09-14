import assert from "node:assert/strict";
import test from "node:test";
import { buildAiReadingPrompt, hasLegacyChoiceReadings, isInsightReport, parseAiReading } from "../lib/ai-reading-parse.ts";

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

const insight = {
  contradiction: {
    paradox: "You want to be held tight, but your body treats closeness as a threat.",
    selfSabotage: "The more you like them, the faster you pick a fight to see if they will leave first.",
  },
  scenes: {
    closeness: { alarm: "They like this version of me because they have not seen the rest.", action: "Go cold for two days after a good date." },
    silence: { alarm: "A slow reply means they are already gone.", action: "Leave them on read and wait for them to panic." },
    conflict: { alarm: "Chest tight, hands cold.", action: "Say something harsh, or reach for block." },
  },
  defense: {
    fear: "If they see you clearly, they will drop you, so you smash it first.",
    excuse: "You call it being rational. You are just afraid to hand yourself over.",
  },
  toolkit: {
    brake: ["Put the phone face down", "Take four breaths", "Name this as an alarm, not a fact"],
    scripts: [
      "I am overloaded and want to pull back for a bit. This is not about liking you less. Give me two hours and I will come find you.",
      "That last line was fear talking, not a verdict. I want to say it again.",
    ],
  },
};

test("parseAiReading accepts the four-module insight JSON", () => {
  const parsed = parseAiReading(`Here you go\n\`\`\`json\n${JSON.stringify(insight)}\n\`\`\``);
  assert.deepEqual(parsed, insight);
  assert.equal(isInsightReport(parsed), true);
});

test("parseAiReading rejects incomplete insight reports", () => {
  assert.equal(parseAiReading('{"contradiction":{"paradox":"x","selfSabotage":"y"}}'), null);
  assert.equal(parseAiReading('{"summary":"You reach first.","choices":[{"questionId":"q1","reading":"ok"}]}'), null);
  assert.equal(parseAiReading("not json"), null);
});

test("buildAiReadingPrompt sends style scores without option wording", () => {
  const built = buildAiReadingPrompt(
    { id: "attachment-style", title: "Attachment Style Quiz" },
    questions,
    { "attachment-style-v3-q01": 0 },
    { key: "anxious", title: "Anxious-Preoccupied", summary: "You move toward the bond.", anxiety: 72, avoidance: 31 },
  );
  assert.match(built.user, /Anxious-Preoccupied/);
  assert.match(built.user, /"language":"en"/);
  assert.match(built.user, /"anxiety":72/);
  assert.doesNotMatch(built.user, /Did I say something wrong/);
  assert.doesNotMatch(built.user, /When their texting suddenly goes cold/);
  assert.doesNotMatch(built.user, /中文|焦虑型/);
  assert.doesNotMatch(built.user, /PRIVATE_ADMIN_MEANING/);
});

test("legacy per-choice snapshots are detected without passing as insight reports", () => {
  const legacy = {
    summary: "You reach first.",
    choices: [{ questionId: "attachment-style-v3-q01", reading: "The dry texts land as a threat to the bond." }],
  };
  assert.equal(isInsightReport(legacy), false);
  assert.equal(hasLegacyChoiceReadings(legacy), true);
  assert.equal(hasLegacyChoiceReadings(insight), false);
});
