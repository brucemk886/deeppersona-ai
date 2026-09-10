import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { questionBank } from "../lib/quiz-question-bank.ts";

test("each live test has 15 catalog questions", () => {
  const tests = Object.keys(questionBank);
  assert.equal(tests.length, 8);
  assert.equal(Object.values(questionBank).reduce((sum, bank) => sum + bank.length, 0), 120);
  for (const id of tests) {
    const bank = questionBank[id];
    assert.equal(bank.length, 15, id);
    assert.ok(bank.slice(0, 5).every((question) => question.atlas), `${id} should open with visual items`);
    assert.ok(bank.slice(5).every((question) => !question.atlas), `${id} should continue with situation items`);
    assert.ok(bank.every((question) => question.options.length === 4), id);
  }
  assert.equal(
    questionBank["attachment-style"][0].prompt,
    "They suddenly go quiet. Which door feels most like your next move?",
  );
  assert.match(questionBank["attachment-style"][6].prompt, /viewed your story/);
  assert.match(questionBank["social-energy"][5].prompt, /ten minutes of heat/);
});

test("typed results and locked modules are wired into the report", async () => {
  const [profiles, deepResults, store] = await Promise.all([
    readFile(new URL("../lib/result-profiles.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/deep-results.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/quiz-store.ts", import.meta.url), "utf8"),
  ]);
  assert.match(profiles, /You reach first/);
  assert.match(profiles, /You need a map/);
  assert.match(profiles, /Every choice decoded/);
  assert.match(profiles, /Your trigger/);
  assert.match(deepResults, /buildTypedResult/);
  assert.match(deepResults, /lockedModules/);
  assert.match(store, /syncCatalogQuestions/);
  assert.match(store, /attachment-style-6/);
  assert.match(profiles, /axisValue\(leftScore, answered\)/);
  assert.match(profiles, /Reach for closeness/);
  assert.match(profiles, /You chase the spark/);
});
