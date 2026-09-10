import assert from "node:assert/strict";
import test from "node:test";
import { matchTestByQuery } from "../lib/test-search.ts";

const tests = [
  { id: "attachment-style", position: 1, title: "How You Attach in Love" },
  { id: "emotional-needs", position: 2, title: "When They Pull Away" },
  { id: "conflict-style", position: 3, title: "After You Fight" },
];

test("matches homepage test codes and titles", () => {
  assert.equal(matchTestByQuery("01", tests)?.id, "attachment-style");
  assert.equal(matchTestByQuery("2", tests)?.id, "emotional-needs");
  assert.equal(matchTestByQuery("attachment-style", tests)?.id, "attachment-style");
  assert.equal(matchTestByQuery("conflict", tests)?.id, "conflict-style");
  assert.equal(matchTestByQuery("missing", tests), null);
  assert.equal(matchTestByQuery(" ", tests), null);
});
