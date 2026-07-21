import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the complete Inner Atlas experience", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  await access(new URL("../public/og-v2.png", import.meta.url));
  await access(new URL("../public/quiz/doors.webp", import.meta.url));
  await access(new URL("../public/quiz/doors-768.webp", import.meta.url));

  const [quiz, catalog, choiceInsights, deepResults, admin, adminStyles, store, layout, hosting] = await Promise.all([
    readFile(new URL("../app/quiz-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/quiz.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/choice-insights.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/deep-results.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../db/quiz-store.ts", import.meta.url), "utf8"),
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
  assert.match(quiz, /Your choices, decoded/);
  assert.match(quiz, /What this choice represents/);
  assert.match(quiz, /Your projection/);
  assert.doesNotMatch(quiz, /7-day|30-day|Your four-choice pattern/);
  assert.doesNotMatch(quiz, /Natural strength|Watch for|Start here/);
  assert.match(quiz, /marketingConsent, setMarketingConsent\] = useState\(false\)/);
  assert.match(deepResults, /How you try to restore safety in closeness/);
  assert.match(choiceInsights, /getOptionInsight/);
  assert.match(choiceInsights, /attachment-style/);
  assert.match(catalog, /attachment-style/);
  assert.match(catalog, /hidden-strength/);
  assert.equal((catalog.match(/id: "[a-z-]+",\n    title:/g) ?? []).length, 8);
  assert.match(admin, /测试管理/);
  assert.match(admin, /题目管理/);
  assert.match(admin, /邮箱用户/);
  assert.match(admin, /用户答题档案/);
  assert.match(admin, /营销分群标签/);
  assert.match(admin, /逐题选择/);
  assert.match(admin, /导出分群 CSV/);
  assert.match(admin, /一个“测试”对应前台的一张测试卡/);
  assert.match(adminStyles, /\/\* Admin readability scale \*\//);
  assert.match(adminStyles, /\.lead-table-cn \{ font-size: 13px; \}/);
  assert.match(store, /COUNT\(DISTINCT id\) AS users FROM quiz_sessions/);
  assert.match(store, /s\.answers_json/);
  assert.match(store, /answerEvents: answerEvents\.results/);
  assert.doesNotMatch(store, /COUNT\(DISTINCT session_id\) AS users FROM quiz_sessions/);
  assert.match(layout, /Visual Psychology Tests/);
  assert.match(hosting, /"d1": "DB"/);
  assert.doesNotMatch(quiz + layout, /codex-preview|react-loading-skeleton/);
});
