import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the complete Inner Atlas experience", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  await access(new URL("../public/og-v2.png", import.meta.url));
  await access(new URL("../public/quiz/doors.webp", import.meta.url));
  await access(new URL("../public/quiz/doors-768.webp", import.meta.url));

  const [quiz, catalog, admin, layout, hosting] = await Promise.all([
    readFile(new URL("../app/quiz-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/quiz.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(quiz, /Inner Atlas/);
  assert.match(quiz, /Start the most popular test/);
  assert.match(quiz, /email_submitted|\/api\/submit/);
  assert.match(quiz, /upgrade_clicked/);
  assert.match(quiz, /image_zoomed/);
  assert.match(quiz, /srcSet/);
  assert.match(quiz, /preloadAtlas/);
  assert.match(catalog, /attachment-style/);
  assert.match(catalog, /hidden-strength/);
  assert.equal((catalog.match(/id: "[a-z-]+",\n    title:/g) ?? []).length, 8);
  assert.match(admin, /测试管理/);
  assert.match(admin, /题目管理/);
  assert.match(admin, /邮箱用户/);
  assert.match(layout, /Visual Psychology Tests/);
  assert.match(hosting, /"d1": "DB"/);
  assert.doesNotMatch(quiz + layout, /codex-preview|react-loading-skeleton/);
});
