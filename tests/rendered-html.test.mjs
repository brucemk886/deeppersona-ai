import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the complete DeepPersona AI experience", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  await access(new URL("../public/og-deep-persona.png", import.meta.url));
  await access(new URL("../public/brand/favicon-v2-32.png", import.meta.url));
  await access(new URL("../public/quiz/doors.webp", import.meta.url));
  await access(new URL("../public/quiz/doors-768.webp", import.meta.url));

  const [home, quiz, catalog, choiceInsights, deepResults, admin, adminStyles, store, layout, analytics, analyticsUi, hosting, privacy, terms, refunds, contact, disclaimer, legalPage, testDetail, sitemap, blogIndex, blogPost, adminStatsRoute, adminStatsRange, trafficPanel, trafficStats] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/quiz-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/quiz-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/choice-insights.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/deep-results.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin-dashboard.tsx", import.meta.url), "utf8"),
    Promise.all([readFile(new URL("../app/globals.css", import.meta.url), "utf8"), readFile(new URL("../public/styles/admin.css", import.meta.url), "utf8")]).then((styles) => styles.join("\n")),
    readFile(new URL("../db/quiz-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/google-analytics.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/_components/google-analytics.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/terms/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/refunds/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/contact/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/disclaimer/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/_components/legal-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/tests/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.xml/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/blog/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/stats/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-stats-range.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/traffic-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/traffic-stats.ts", import.meta.url), "utf8"),
  ]);

  const homeLanding = await readFile(new URL("../app/_components/home-landing.tsx", import.meta.url), "utf8");
  const siteChrome = await readFile(new URL("../app/_components/site-chrome.tsx", import.meta.url), "utf8");
  const attachment = await readFile(new URL("../lib/attachment.ts", import.meta.url), "utf8");
  const freeResults = await readFile(new URL("../app/_components/free-attachment-results.tsx", import.meta.url), "utf8");
  const resultsUi = quiz + freeResults;
  assert.match(quiz, /<BrandLogo/);
  assert.match(await readFile("app/_components/brand.tsx", "utf8"), /alt="DeepPersona AI"/);
  assert.match(homeLanding, /Do you know your attachment style\?/);
  assert.match(homeLanding, /Start the free quiz/);
  assert.match(siteChrome, /Not a clinical diagnosis/);
  assert.match(homeLanding, /Anxious-leaning/);
  assert.match(homeLanding, /Avoidant-leaning/);
  assert.match(siteChrome, /href="\/blog"/);
  assert.doesNotMatch(quiz + homeLanding, /Enter the test number from the video/);
  assert.doesNotMatch(quiz, /hero-search/);
  assert.match(quiz, /email_submitted|\/api\/submit/);
  assert.match(quiz, /upgrade_clicked/);
  assert.match(quiz, /Choose \$\{letter\}/);
  assert.match(quiz, /option-grid-text/);
  assert.match(quiz, /showsOptionImages/);
  assert.match(quiz, /presentationMode/);
  assert.doesNotMatch(quiz, /image_zoomed|image-lightbox/);
  assert.match(quiz, /srcSet/);
  assert.match(quiz, /preloadAtlas/);
  assert.match(quiz, /initialQuestions/);
  assert.match(quiz, /AbortController/);
  assert.doesNotMatch(quiz, /className="hero-mosaic"/);
  assert.match(quiz, /HomeLanding/);
  assert.match(quiz, /Your choices, decoded/);
  assert.match(quiz, /What this choice may be reflecting/);
  assert.match(quiz, /aiReading/);
  assert.doesNotMatch(quiz, /What this choice represents/);
  assert.match(quiz, /Your romantic patterns/);
  assert.match(quiz, /superpowers in romance/);
  assert.doesNotMatch(quiz, /AiInsightReportV2|the lines to send instead/);
  assert.doesNotMatch(quiz, /7-day practice|7天脱敏/);
  assert.doesNotMatch(quiz, /30-day|Your four-choice pattern/);
  assert.doesNotMatch(quiz, /Natural strength|Start here/);
  assert.match(quiz, /marketingConsent: false/);
  assert.doesNotMatch(quiz, /Instant reflection/);
  assert.match(quiz, /Your Inner Map/);
  assert.doesNotMatch(quiz, /That feels accurate/);
  assert.match(quiz, /See your relationship patterns/);
  assert.match(resultsUi, /Unlock full results/);
  assert.match(resultsUi, /How you scored/);
  assert.match(resultsUi, /Your romantic patterns/);
  assert.match(resultsUi, /caregiver attachment patterns/);
  assert.doesNotMatch(resultsUi, /Unlock my full reading/);
  assert.doesNotMatch(resultsUi, /Full childhood detail is locked|paid reading/);
  assert.doesNotMatch(resultsUi, /Mother \(CG|Father \(CG|AT WORK|millions of users/i);
  assert.match(attachment, /scoreAttachment/);
  const liveCatalog = catalog.slice(0, catalog.indexOf("RETIRED_QUESTION_PROMPTS"));
  assert.match(catalog, /relationshipQuestions\.map/);
  assert.doesNotMatch(liveCatalog, /They suddenly go quiet/);
  assert.doesNotMatch(liveCatalog, /Which room feels safest to share/);
  assert.doesNotMatch(catalog, /id: "attachment-style-1"/);
  assert.match(deepResults, /buildChoiceReport/);
  assert.doesNotMatch(admin, /计分类型|连接者|创造者/);
  assert.doesNotMatch(quiz, /calculateResult|scoreKey/);
  assert.match(choiceInsights, /getOptionInsight/);
  assert.match(choiceInsights, /attachment-style/);
  assert.match(catalog, /attachment-style/);
  assert.match(catalog, /presentationMode: "text"/);
  assert.match(catalog, /hidden-strength/);
  assert.equal((catalog.match(/id: ATTACHMENT_TEST_ID|id: "[a-z-]+",\r?\n    title:/g) ?? []).length, 8);
  assert.match(admin, /测试管理/);
  assert.match(admin, /题目管理/);
  assert.doesNotMatch(admin, /<label>补充说明|<label>选择含义|<label>投射解读/);
  assert.match(admin, /由 AI 直接生成/);
  assert.match(admin, /博客管理/);
  assert.match(admin, /addBlogPost/);
  assert.match(admin, /removeBlogPost/);
  assert.match(admin, /邮箱用户/);
  assert.match(admin, /DeepPersona AI/);
  assert.match(admin, /用户测试记录/);
  assert.doesNotMatch(admin, /营销分群标签|segmentRecommendations|getMarketingTags/);
  assert.match(admin, /逐题选择/);
  assert.match(admin, /导出测试记录 CSV/);
  assert.match(admin, /一个“测试”对应前台的一张测试卡/);
  assert.match(admin, /stats-range-switcher/);
  assert.match(admin + adminStatsRange, /今天/);
  assert.match(admin + adminStatsRange, /昨天/);
  assert.match(admin + adminStatsRange, /近7天/);
  assert.match(admin + adminStatsRange, /近30天/);
  assert.match(admin, /\/api\/admin\/stats\?range=/);
  assert.match(adminStyles, /\/\* Admin readability scale \*\//);
  assert.match(adminStyles, /\.test-card-image \.atlas-image img/);
  assert.match(adminStyles, /aspect-ratio: 4 \/ 5/);
  assert.match(adminStyles, /\.lead-table-cn \{ font-size: 13px; \}/);
  const quizCopy = await readFile(new URL("../lib/quiz-copy.ts", import.meta.url), "utf8");
  assert.match(quiz + quizCopy, /No wrong answers\./);
  assert.match(quiz, /QUIZ_HELPER_EN/);
  assert.doesNotMatch(quiz, /There is no correct choice/);
  assert.match(store, /options_json = excluded.options_json/);
  assert.match(store, /prompt = excluded.prompt/);
  assert.match(store, /kicker = excluded.kicker/);
  assert.match(store, /atlas_path = excluded.atlas_path/);
  assert.match(store, /presentation_mode/);
  assert.match(store, /attachment-v12-text-2026-09/);
  assert.match(store, /attachment-v12-en-2026-09/);
  assert.match(store, /strip-canned-option-readings-2026-09/);
  assert.match(homeLanding, /text left on Read/);
  assert.doesNotMatch(homeLanding, /weekend invite/);
  assert.match(catalog, /They invite you to spend a weekend together/);
  assert.match(store, /COUNT\(DISTINCT s\.id\) AS users FROM quiz_sessions/);
  assert.match(store, /answers: answerRecords/);
  assert.match(adminStyles, /\.stats-range-switcher/);
  assert.match(adminStyles, /--chart-cols/);
  assert.match(adminStatsRoute, /searchParams\.get\("range"\)/);
  assert.match(adminStatsRoute, /getTrafficStats\(range\)/);
  assert.match(trafficStats, /adminStatsTimePredicate/);
  assert.match(trafficStats, /completeAdminStatsSeries/);
  assert.match(trafficPanel, /stats-range-switcher/);
  assert.match(trafficPanel, /onRangeChange/);
  assert.doesNotMatch(trafficPanel, /近 14 天/);
  assert.match(store, /answerEvents: answerEvents\.results/);
  assert.match(store, /adminStatsTimePredicate/);
  assert.match(store, /strftime\('%Y-%m-%d %H:00', s\.started_at/);
  assert.match(adminStatsRange, /datetime\('now', '\+8 hours', '-29 days', 'start of day'\)/);
  assert.match(adminStatsRange, /today[\s\S]*yesterday[\s\S]*7d[\s\S]*30d/);
  assert.doesNotMatch(store, /COUNT\(DISTINCT session_id\) AS users FROM quiz_sessions/);
  assert.match(layout, /DeepPersona AI — Free Attachment Style Quiz/);
  assert.match(layout, /og-deep-persona\.png/);
  assert.match(layout, /favicon-v2-32\.png/);
  assert.match(layout, /width: "device-width"/);
  assert.match(layout, /GoogleAnalytics/);
  assert.match(analytics, /G-WS2Z8SKMY1/);
  assert.match(analytics, /generate_lead|quiz_start/);
  assert.doesNotMatch(analyticsUi, /Allow analytics/);
  assert.match(analyticsUi, /anonymous:true/);
  assert.match(analyticsUi, /return null/);
  assert.doesNotMatch(quiz + analytics, /emailToSave.*trackGoogleAnalyticsEvent|optionLabel.*trackGoogleAnalyticsEvent/);
  assert.match(privacy, /Test information/);
  assert.match(privacy, /Google Analytics to measure visits/);
  assert.match(privacy, /marketing emails/);
  assert.match(terms, /Not healthcare or professional advice/);
  assert.match(refunds, /Final sales after delivery/);
  assert.match(refunds, /legacy-2026-09/);
  assert.match(refunds, /Digital delivery/);
  assert.match(contact, /SUPPORT_EMAIL/);
  assert.match(legalPage, /bruce@deeppersonaai\.com/);
  assert.match(disclaimer, /not validated diagnostic instruments/);
  for (const [page, canonical] of [[home, "/"], [privacy, "/privacy"], [terms, "/terms"], [refunds, "/refunds"], [contact, "/contact"], [disclaimer, "/disclaimer"]]) {
    assert.match(page, new RegExp(`alternates: \\{ canonical: "${canonical}" \\}`));
  }
  assert.match(testDetail, /generateMetadata/);
  assert.match(testDetail, /alternates: \{ canonical \}/);
  assert.match(testDetail, /\/tests\/\$\{test\.id\}/);
  assert.match(sitemap, /Content-Type": "application\/xml/);
  assert.match(sitemap, /export async function GET/);
  assert.match(sitemap, /defaultTests/);
  assert.match(sitemap, /insightClusters/);
  assert.match(sitemap, /insightArticleCards/);
  assert.match(sitemap, /listBlogPosts/);
  assert.match(sitemap, /path: "\/blog"/);
  assert.match(sitemap, /https:\/\/deeppersonaai\.com/);
  assert.match(quiz + siteChrome + legalPage, /href="\/blog"/);
  assert.match(blogIndex, /canonical: "\/blog"/);
  assert.match(blogIndex, /ATTACHMENT_QUIZ_PATH/);
  assert.match(blogPost, /canonical: `\/blog\/\$\{post\.slug\}`/);
  assert.match(blogPost, /blogQuizHref/);
  assert.match(legalPage, /href="\/blog"/);
  assert.match(hosting, /"d1": "DB"/);
  assert.doesNotMatch(quiz + layout, /codex-preview|react-loading-skeleton/);
});
