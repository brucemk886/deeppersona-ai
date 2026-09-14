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
    paradox: "你越想被抱紧，身体越把靠近当成危险。",
    selfSabotage: "喜欢上头时你会先刺对方一眼，确认对方会不会先走。",
  },
  scenes: {
    closeness: { alarm: "他现在觉得我好，是还没看穿。", action: "约会后突然冷淡两天。" },
    silence: { alarm: "不回就是在放弃我。", action: "已读不回，等对方先慌。" },
    conflict: { alarm: "胸口发紧，手脚发冷。", action: "放狠话，或者直接想拉黑。" },
  },
  defense: {
    fear: "怕被看穿后扔掉，所以先自己砸碎。",
    excuse: "嘴上说谈恋爱麻烦，其实是不敢把自己交出去。",
  },
  toolkit: {
    brake: ["先把手机扣过去", "数四次呼吸", "告诉自己这是警报不是事实"],
    scripts: [
      "我现在有点过载，想先躲一下。这不是不喜欢你。给我两小时，我回来找你。",
      "我刚才那句狠话是害怕，不是结论。我想重新说一遍。",
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
  assert.match(built.user, /焦虑型/);
  assert.match(built.user, /"anxiety":72/);
  assert.doesNotMatch(built.user, /Did I say something wrong/);
  assert.doesNotMatch(built.user, /When their texting suddenly goes cold/);
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
