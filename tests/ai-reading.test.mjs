import assert from "node:assert/strict";
import test from "node:test";
import { buildAiReadingPrompt, hasCjkText, hasLegacyChoiceReadings, isInsightReport, isInsightV2, needsAiUpgrade, parseAiReading, publicInsightReport, publicInsightV2 } from "../lib/ai-reading-parse.ts";

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

const insightV2 = {
  version: 2,
  hook: {
    patternName: "The Two-Day Freeze",
    mirror: "It is 11:40pm and the date went well. You reread your last text three times. By morning you have decided they were being polite.",
    tell: "You open their profile, then close it before it can register as a view.",
  },
  cost: [
    "The one who kept asking stopped asking in March.",
    "Two years of a good thing spent auditing it instead of living in it.",
  ],
  turningPoint: {
    setup: "Third week. They start making plans that assume you. Something in your chest goes flat, and you reach for the phone.",
    move: "You send a short, correct text and go dark for two days.",
    misread: "They read the silence as a verdict on them, not as your alarm going off.",
  },
  teasers: [
    "What you actually send at hour six, and why it reads as goodbye.",
    "The sentence they have already said about you to a friend.",
    "What the next 60 days look like if the freeze stays.",
    "The 30-word text that replaces the freeze.",
  ],
  throughTheirEyes: "They notice the pause before you answer. They stop suggesting Sundays.",
  forecast: "Around week six the plans stop. By week ten you are relieved, then not.",
  coverStory: "You call it needing space. The detail that gives it away is how fast you check whether they noticed.",
  toolkit: {
    brake: ["Put the phone face down", "Take four breaths", "Name this as an alarm, not a fact"],
    scripts: [
      "I am overloaded and want to pull back for a bit. This is not about liking you less. Give me two hours and I will come find you.",
      "That last line was fear talking, not a verdict. I want to say it again.",
    ],
  },
};

test("parseAiReading accepts the hook-and-payoff insight JSON", () => {
  const parsed = parseAiReading(`Here you go\n\`\`\`json\n${JSON.stringify(insightV2)}\n\`\`\``);
  assert.deepEqual(parsed, insightV2);
  assert.equal(isInsightV2(parsed), true);
  assert.equal(isInsightReport(parsed), false);
  assert.equal(publicInsightV2(parsed)?.hook.patternName, "The Two-Day Freeze");
});

test("parseAiReading rejects incomplete or older shapes", () => {
  assert.equal(parseAiReading(JSON.stringify(insight)), null);
  assert.equal(parseAiReading(JSON.stringify({ ...insightV2, teasers: ["only one"] })), null);
  assert.equal(parseAiReading('{"summary":"You reach first.","choices":[{"questionId":"q1","reading":"ok"}]}'), null);
  assert.equal(parseAiReading("not json"), null);
});

test("older four-module snapshots still validate as v1 for existing reports", () => {
  assert.equal(isInsightReport(insight), true);
  assert.equal(isInsightV2(insight), false);
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

test("publicInsightReport hides Chinese insight copy from the English site", () => {
  assert.equal(hasCjkText(insight), false);
  assert.equal(publicInsightReport(insight)?.contradiction.paradox, insight.contradiction.paradox);
  const chinese = {
    ...insight,
    contradiction: {
      paradox: "你渴望被抱紧，却在对方向你伸手时一刀捅过去。",
      selfSabotage: insight.contradiction.selfSabotage,
    },
  };
  assert.equal(hasCjkText(chinese), true);
  assert.equal(publicInsightReport(chinese), null);
});

test("needsAiUpgrade runs once per report and leaves purchased per-choice snapshots alone", () => {
  assert.equal(needsAiUpgrade({ aiReading: insightV2 }), false);
  assert.equal(needsAiUpgrade({ aiReading: insight }), true);
  assert.equal(needsAiUpgrade({ aiReading: insight, aiUpgradeAttempted: true }), false);
  assert.equal(needsAiUpgrade({ aiReading: { ...insightV2, hook: { ...insightV2.hook, mirror: "你还在" } } }), true);
  assert.equal(needsAiUpgrade({ aiReading: undefined }), true);
  assert.equal(needsAiUpgrade({ aiReading: { summary: "x", choices: [{ questionId: "q1", reading: "ok" }] } }), false);
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
