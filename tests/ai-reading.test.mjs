import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAiReadingPrompt,
  hasCjkText,
  hasLegacyChoiceReadings,
  isAttachmentModules,
  isInsightReport,
  isInsightV2,
  needsAiUpgrade,
  parseAiReading,
  publicAttachmentModules,
  publicInsightReport,
} from "../lib/ai-reading-parse.ts";

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

const modules = {
  version: 3,
  romanceEssay: "When a reply goes cold, your chest drops first. You treat the silence as a verdict before you have a fact. That same night you still want the title, because a label feels like the only thing that would settle your body. The cost is that the evening becomes a trial you run alone.",
  characteristics: [
    "You read a dry text as proof you already did something wrong.",
    "You close the gap fast after a fight.",
    "You want a label when the bond speeds up.",
    "You keep one eye on their activity while you wait.",
    "You apologize early to keep them from leaving.",
  ],
  superpowers: [
    "You notice a shift in tone before other people do.",
    "You are willing to repair instead of pretending nothing happened.",
    "You can name what you need once the moment feels safe enough.",
  ],
  triggers: [
    "A colder reply with no explanation.",
    "Last-minute cancelations.",
    "A partner asking for space without a return time.",
  ],
  selfWorthSentences: "Worth still has to be proven in the thread. A late reply becomes a story about whether you are still chosen. You can take a compliment, then test it. The day starts to orbit the unanswered message.",
  rewrites: [
    { from: "If they are quiet, I am already losing them.", to: "They are quiet. I know one fact, and I can ask one question later." },
    { from: "I have to fix this now.", to: "Repair can wait twenty minutes and still count." },
  ],
  essay: {
    dating: "In dating, a cooler phone pulls the whole evening into the chat. You look for a sign you still matter before you can enjoy the night.",
    conflict: "In conflict, you close the gap with more texts and another apology. An open rupture feels like the relationship is already leaving the room.",
    need: "You need a visible thread: a return time, a plain sentence, a plan that makes the pause feel shared.",
  },
  pairing: [
    { style: "Anxious-Preoccupied", note: "With another anxious person, both of you flood the thread when a reply is late." },
    { style: "Dismissing-Avoidant", note: "With an avoidant person, your reach meets their space and the night gets louder." },
    { style: "Secure", note: "With a securer person, their calm can feel like not enough heat until you let the next step count." },
    { style: "Fearful-Avoidant", note: "With a fearful-avoidant person, a pull-away starts a chase, then a chase starts the next exit." },
  ],
};

test("parseAiReading accepts Attachment Project-style modules written from answers", () => {
  const parsed = parseAiReading(`Here you go\n\`\`\`json\n${JSON.stringify(modules)}\n\`\`\``);
  assert.deepEqual(parsed, modules);
  assert.equal(isAttachmentModules(parsed), true);
  assert.equal(publicAttachmentModules(parsed)?.characteristics.length, 5);
});

test("parseAiReading rejects incomplete or older shapes", () => {
  assert.equal(parseAiReading(JSON.stringify(insight)), null);
  assert.equal(parseAiReading(JSON.stringify({ ...modules, characteristics: ["only one"] })), null);
  assert.equal(parseAiReading('{"summary":"You reach first.","choices":[{"questionId":"q1","reading":"ok"}]}'), null);
  assert.equal(parseAiReading("not json"), null);
});

test("older snapshots still validate as their own shapes", () => {
  assert.equal(isInsightReport(insight), true);
  assert.equal(isInsightV2({ version: 2, hook: { patternName: "The Two-Day Freeze" } }), true);
  assert.equal(isAttachmentModules(insight), false);
});

test("buildAiReadingPrompt sends the first-reaction answers the person actually picked", () => {
  const built = buildAiReadingPrompt(
    { id: "attachment-style", title: "Attachment Style Quiz" },
    questions,
    { "attachment-style-v3-q01": 0 },
    { key: "anxious", title: "Anxious-Preoccupied", summary: "You move toward the bond.", anxiety: 72, avoidance: 31 },
  );
  assert.match(built.user, /Anxious-Preoccupied/);
  assert.match(built.user, /"language":"en"/);
  assert.match(built.user, /"anxiety":72/);
  assert.match(built.user, /Did I say something wrong/);
  assert.match(built.user, /When their texting suddenly goes cold/);
  assert.match(built.user, /firstMoves/);
  assert.doesNotMatch(built.user, /中文|焦虑型/);
  assert.doesNotMatch(built.user, /PRIVATE_ADMIN_MEANING/);
});

test("publicAttachmentModules hides Chinese copy from the English site", () => {
  assert.equal(hasCjkText(modules), false);
  assert.equal(publicAttachmentModules(modules)?.romanceEssay, modules.romanceEssay);
  const chinese = { ...modules, romanceEssay: "你渴望被抱紧，却在对方向你伸手时一刀捅过去。" };
  assert.equal(hasCjkText(chinese), true);
  assert.equal(publicAttachmentModules(chinese), null);
  assert.equal(publicInsightReport({ ...insight, contradiction: { ...insight.contradiction, paradox: "你还在" } }), null);
});

test("needsAiUpgrade runs once per report and leaves purchased per-choice snapshots alone", () => {
  assert.equal(needsAiUpgrade({ aiReading: modules }), false);
  assert.equal(needsAiUpgrade({ aiReading: insight }), true);
  assert.equal(needsAiUpgrade({ aiReading: { version: 2, hook: { patternName: "x" } } }), true);
  assert.equal(needsAiUpgrade({ aiReading: modules, aiUpgradeAttempted: true }), false);
  assert.equal(needsAiUpgrade({ aiReading: { ...modules, romanceEssay: "你还在" } }), true);
  assert.equal(needsAiUpgrade({ aiReading: undefined }), true);
  assert.equal(needsAiUpgrade({ aiReading: { summary: "x", choices: [{ questionId: "q1", reading: "ok" }] } }), false);
});

test("legacy per-choice snapshots are detected without passing as module reports", () => {
  const legacy = {
    summary: "You reach first.",
    choices: [{ questionId: "attachment-style-v3-q01", reading: "The dry texts land as a threat to the bond." }],
  };
  assert.equal(isAttachmentModules(legacy), false);
  assert.equal(hasLegacyChoiceReadings(legacy), true);
  assert.equal(hasLegacyChoiceReadings(modules), false);
});
