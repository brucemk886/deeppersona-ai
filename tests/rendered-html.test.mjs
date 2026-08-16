import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

async function readQuizSurface() {
  const quizRoot = fileURLToPath(new URL("../app/quiz", import.meta.url));
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
    }
  }
  await walk(quizRoot);
  files.push(fileURLToPath(new URL("../app/quiz-app.tsx", import.meta.url)));
  const chunks = await Promise.all(files.map((file) => readFile(file, "utf8")));
  return chunks.join("\n");
}

test("builds the complete DeepPersona AI experience", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  await access(new URL("../public/og-deep-persona.png", import.meta.url));
  await access(new URL("../public/quiz/doors.webp", import.meta.url));
  await access(new URL("../public/quiz/doors-768.webp", import.meta.url));

  const [quiz, catalog, choiceInsights, deepResults, adminShell, testEditor, leadsPanel, adminStyles, store, layout, hosting, privacy, terms, refunds, contact, disclaimer, legalPage, publicCatalog] = await Promise.all([
    readQuizSurface(),
    readFile(new URL("../lib/quiz.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/choice-insights.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/deep-results.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/_components/admin-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/_components/test-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/_components/leads-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../db/quiz-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/terms/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/refunds/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/contact/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/disclaimer/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/_components/legal-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/catalog/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(quiz, /DeepPersona AI/);
  assert.match(quiz, /Explore the most popular test/);
  assert.match(quiz, /email_submitted|\/api\/submit/);
  assert.match(quiz, /upgrade_clicked/);
  assert.match(quiz, /Choose \$\{letter\}/);
  assert.doesNotMatch(quiz, /image_zoomed|image-lightbox/);
  assert.match(quiz, /srcSet/);
  assert.match(quiz, /preloadAtlas/);
  assert.match(quiz, /defaultQuestions/);
  assert.match(quiz, /AbortController/);
  assert.match(quiz, /className="hero-mosaic"/);
  assert.match(quiz, /className={`test-card/);
  assert.match(quiz, /Your choices, decoded/);
  assert.match(quiz, /What this choice represents/);
  assert.match(quiz, /Your projection/);
  assert.doesNotMatch(quiz, /7-day|30-day|Your four-choice pattern/);
  assert.doesNotMatch(quiz, /Natural strength|Watch for|Start here/);
  assert.match(quiz, /marketingConsent: false/);
  assert.doesNotMatch(quiz, /Instant reflection/);
  assert.match(quiz, /Your Inner Map/);
  assert.doesNotMatch(quiz, /That feels accurate/);
  assert.match(quiz, /See what every choice reveals/);
  assert.match(quiz, /Unlock my full reading/);
  assert.match(quiz, /\/api\/catalog/);
  assert.match(publicCatalog, /listTests\(false\)/);
  assert.match(publicCatalog, /listAffiliateProducts\(false\)/);
  assert.match(deepResults, /How you try to restore safety in closeness/);
  assert.match(choiceInsights, /getOptionInsight/);
  assert.match(choiceInsights, /attachment-style/);
  assert.match(catalog, /attachment-style/);
  assert.match(catalog, /hidden-strength/);
  assert.equal((catalog.match(/id: "[a-z-]+",\n    title:/g) ?? []).length, 8);
  assert.match(adminShell, /测试内容/);
  assert.match(adminShell, /邮箱线索/);
  assert.match(adminShell, /DeepPersona AI/);
  assert.match(testEditor, /题目管理/);
  assert.match(testEditor, /一个“测试”对应前台的一张测试卡/);
  assert.match(leadsPanel, /用户答题档案/);
  assert.match(leadsPanel, /营销分群标签/);
  assert.match(leadsPanel, /逐题选择/);
  assert.match(leadsPanel, /导出分群 CSV/);
  assert.match(adminStyles, /\/\* Admin readability scale \*\//);
  assert.match(adminStyles, /\.test-card-image \.atlas-image img/);
  assert.match(adminStyles, /aspect-ratio: 4 \/ 5/);
  assert.match(adminStyles, /\.lead-table-cn \{ font-size: 13px; \}/);
  assert.match(store, /COUNT\(DISTINCT id\) AS users FROM quiz_sessions/);
  assert.match(store, /s\.answers_json/);
  assert.match(store, /listAdminLeads/);
  assert.match(store, /getAdminLeadDetail/);
  assert.doesNotMatch(store, /COUNT\(DISTINCT session_id\) AS users FROM quiz_sessions/);
  assert.match(layout, /DeepPersona AI — Visual Psychology Tests/);
  assert.match(layout, /og-deep-persona\.png/);
  assert.match(layout, /width: "device-width"/);
  assert.match(privacy, /Test information/);
  assert.match(privacy, /marketing emails/);
  assert.match(terms, /Not healthcare or professional advice/);
  assert.match(refunds, /14 calendar days/);
  assert.match(refunds, /Digital delivery/);
  assert.match(contact, /SUPPORT_EMAIL/);
  assert.match(legalPage, /bruce@loversdaily\.com/);
  assert.match(disclaimer, /not validated diagnostic instruments/);
  assert.match(hosting, /"d1": "DB"/);
  assert.doesNotMatch(quiz + layout, /codex-preview|react-loading-skeleton/);
});
