import assert from "node:assert/strict";
import test from "node:test";
import { absoluteHttpsUrl, buildPsychologySyncFeed } from "../lib/psychology-sync.ts";

const tests = [
  {
    id: "attachment-style",
    title: "How You Attach in Love",
    kicker: "Most popular · Relationships",
    description: "See how you move toward closeness.",
    coverAtlasPath: "/quiz/doors.png",
    accent: "#d7c4a3",
    position: 1,
    active: true,
    featured: true,
    reportPriceCents: 499,
    results: {},
    questionCount: 1,
  },
];

const questions = [
  {
    id: "attachment-style-1",
    testId: "attachment-style",
    kicker: "Trust your first response",
    prompt: "They suddenly go quiet. Which door feels most like your next move?",
    atlasPath: "/quiz/doors.png",
    position: 1,
    active: true,
    options: [
      { label: "Ask what changed", microcopy: "Move toward it", scoreKey: "explorer", meaning: "You go toward the unknown.", projection: "You want a clear next move." },
      { label: "Send a warm check-in", microcopy: "Reach for connection", scoreKey: "connector", meaning: "You repair first.", projection: "You move toward the person." },
      { label: "Give them space", microcopy: "Create some clarity", scoreKey: "architect", meaning: "You regulate first.", projection: "You protect the bond by pausing." },
      { label: "Wait, then reach out", microcopy: "Follow the feeling", scoreKey: "creator", meaning: "You wait for the right moment.", projection: "You trust timing." },
    ],
  },
];

test("Local Factory feed keeps official test grouping, prompts, options, and images", () => {
  const feed = buildPsychologySyncFeed(tests, questions, "https://deeppersonaai.com/api/integrations/psychology-questions");

  assert.equal(feed.source, "deeppersona-ai");
  assert.equal(feed.tests[0].title, "How You Attach in Love");
  assert.equal(feed.tests[0].coverImageUrl, "https://deeppersonaai.com/quiz/doors.png");
  assert.equal(feed.items[0].testTitle, "How You Attach in Love");
  assert.equal(feed.items[0].question, feed.items[0].prompt);
  assert.equal(feed.items[0].imageUrl, "https://deeppersonaai.com/quiz/doors.png");
  assert.equal(feed.items[0].options[0].letter, "A");
  assert.equal(feed.items[0].options[0].text, "Ask what changed");
  assert.equal(feed.items[0].options[0].label, "Ask what changed");
  assert.equal(feed.items[0].options[0].scoreKey, "explorer");
  assert.equal(absoluteHttpsUrl("/quiz/rooms.png", "http://localhost/api/integrations/psychology-questions"), "https://localhost/quiz/rooms.png");
});
