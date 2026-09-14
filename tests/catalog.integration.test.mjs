import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Miniflare } from "miniflare";

test("admin catalog edits persist across public reads and fresh Worker isolates", async (t) => {
  const modules = ["index.js", ...readdirSync("dist/server", { recursive: true }).filter(p => p.endsWith(".js") && p !== "index.js")]
    .map(p => ({ type: "ESModule", path: resolve("dist/server", p) }));
  const mf = new Miniflare({ host: "127.0.0.1", port: 0, inspectorPort: 0, workers:
    ["editor", "migration", "restart", "empty-restart"].map(name => ({
      name, modules, modulesRoot: resolve("dist/server"), compatibilityDate: "2026-05-22", compatibilityFlags: ["nodejs_compat"],
      bindings: { ADMIN_PASSWORD: "fixture", ADMIN_SESSION_SECRET: "catalog-local-fixture", STRIPE_SECRET_KEY: "sk_test_local_fixture" },
      d1Databases: { DB: "catalog-db" },
    })),
  });
  try {
    const base = new URL(await mf.ready).origin;
    const db = await mf.getD1Database("DB", "editor");
    const issuedAt = String(Math.floor(Date.now() / 1000));
    const cookie = "deeppersona_admin=" + issuedAt + "." + createHmac("sha256", "catalog-local-fixture").update("admin." + issuedAt).digest("hex");
    const request = async (path, { method = "GET", body, admin = false, locale = "en", worker = "editor", origin = base, profileCookie } = {}) => {
      const stub = await mf.getWorker(worker);
      const response = await stub.fetch(base + path, { method,
        headers: { origin, "content-type": "application/json", "accept-language": locale, ...(admin ? { cookie } : profileCookie ? { cookie: profileCookie } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      return { status: response.status, headers: response.headers, data };
    };
    const questions = async (options = {}) => (await request("/api/questions?test=attachment-style" + (options.admin ? "&all=1" : ""), options)).data.questions;
    const save = async (question) => assert.equal((await request("/api/questions", { method: "PUT", admin: true, body: question })).status, 200);
    // Parallel first requests exercise the atomic empty-database seed.
    const [catalog, first] = await Promise.all([request("/api/tests"), questions({ admin: true })]);
    assert.equal(first.length, 20);
    const originalTest = catalog.data.tests.find(item => item.id === "attachment-style");
    assert.ok(originalTest);
    assert.equal(originalTest.presentationMode, "text");
    assert.equal(first[0].prompt, "对方聊天突然冷淡、字数变少，你第一瞬间的感觉是？");
    assert.equal(first[0].atlasPath, "");
    const edited = structuredClone(first[0]);
    Object.assign(edited, { prompt: "ADMIN: Which scene would you choose?", atlasPath: first[1].atlasPath, position: 7 });
    Object.assign(edited.options[0], { label: "A freshly edited image", microcopy: "Edited caption", meaning: "PRIVATE_ADMIN_MEANING", projection: "PRIVATE_ADMIN_PROJECTION", readingFocus: "repair", styleKey: "secure", cardTone: "warm" });

    await t.test("public questions and server-rendered entries keep admin text in Chinese-language browsers", async () => {
      const english = await questions({ locale: "en-US,en;q=0.9" });
      for (const [index, question] of english.entries()) {
        assert.equal(question.prompt, first[index].prompt);
        assert.equal(question.kicker, first[index].kicker);
        assert.deepEqual(question.options.map(o => [o.label, o.microcopy]), first[index].options.map(o => [o.label, o.microcopy]));
      }
      for (const locale of ["zh-CN,zh;q=0.9,en;q=0.8", "en-US,zh;q=0.5", "zh-TW", "fr-FR"]) {
        assert.deepEqual(await questions({ locale }), english, `all question fields must be independent of ${locale}`);
      }
      const editor = await mf.getWorker("editor");
      for (const path of ["/", "/?test=attachment-style", "/tests/attachment-style"]) {
        const response = await editor.fetch(base + path, { headers: { "accept-language": "zh-CN,zh;q=0.9" } });
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.ok(html.includes(first[0].prompt), `${path} must initialize with the saved English prompt`);
        assert.ok(html.includes(first[0].options[0].label));
        assert.ok(!html.includes("短信显示"), `${path} must not inject the old Chinese question`);
        assert.ok(!html.includes(first[0].options[0].meaning), "SSR must still hide paid interpretations");
      }
    });

    await t.test("admin saves every editable field; public English/Chinese reads use it", async () => {
      assert.equal((await request("/api/questions?all=1")).status, 401);
      assert.equal((await request("/api/questions", { method: "PUT", body: edited })).status, 401);
      await save(edited);
      for (let i = 0; i < 3; i++) {
        await request("/api/tests");
        assert.deepEqual((await questions({ admin: true })).find(q => q.id === edited.id), edited);
        for (const locale of ["en", "zh-CN"]) {
          const actual = (await questions({ locale })).find(q => q.id === edited.id);
          assert.equal(actual.prompt, edited.prompt);
          assert.equal(actual.atlasPath, edited.atlasPath);
          assert.equal(actual.options[0].label, edited.options[0].label);
          assert.equal(actual.options[0].microcopy, edited.options[0].microcopy);
          assert.equal(actual.options[0].meaning, "");
          assert.equal(actual.options[0].projection, "");
        }
      }
      const response = await request("/api/questions");
      assert.equal(response.headers.get("cache-control"), "no-store");
      for (const bundle of readdirSync("dist/client", { recursive: true }).filter(p => p.endsWith(".js"))) {
        assert.ok(!readFileSync(resolve("dist/client", bundle), "utf8").includes(first[0].options[0].meaning), "client bundles must not include paid meanings");
      }
    });

    const added = { ...structuredClone(edited), id: "admin-added-question", prompt: "ADMIN: New first question", position: 0, active: false };
    await t.test("new questions, drafts, ordering, previews and deletion match the admin", async () => {
      await save(added);
      assert.ok((await questions({ admin: true })).some(q => q.id === added.id));
      assert.ok(!(await questions()).some(q => q.id === added.id));
      added.active = true;
      await save(added);
      assert.equal((await questions())[0].id, added.id);
      assert.equal((await request("/api/tests")).data.tests[0].questionCount, 21);
      const editor = await mf.getWorker("editor");
      const detail = await (await editor.fetch(base + "/tests/attachment-style", { headers: { "accept-language": "en" } })).text();
      assert.ok(detail.includes(added.prompt), "SSR preview follows the first published question, even when its position is 0");
      assert.ok(detail.includes(added.atlasPath));
      assert.ok(!detail.includes(edited.options[0].meaning));
      assert.equal((await request("/api/questions?id=" + first.at(-1).id, { method: "DELETE", admin: true })).status, 200);
      for (let i = 0; i < 2; i++) assert.ok(!(await questions({ admin: true })).some(q => q.id === first.at(-1).id));
      await save({ ...edited, active: false });
      assert.ok(!(await questions()).some(q => q.id === edited.id));
      await save(edited);
    });

    const editedTest = { ...originalTest, title: "Admin catalog title", description: "Admin description", coverAtlasPath: first[2].atlasPath, reportPriceCents: 500 };
    const saveTest = async (body) => assert.equal((await request("/api/tests", { method: "PUT", admin: true, body })).status, 200);
    await t.test("test publication, metadata and prices stay under admin control", async () => {
      await saveTest({ ...editedTest, active: false });
      assert.equal((await questions()).length, 0, "an unpublished test has no public questions");
      assert.equal((await questions({ admin: true })).length, 20);
      await saveTest(editedTest);
      assert.deepEqual((await request("/api/tests")).data.tests[0], { ...editedTest, questionCount: 20 });
      // Simulate upgrading an existing database with no initialization marker.
      await db.prepare("DELETE FROM quiz_catalog_state").run();
      const migrated = await questions({ admin: true, worker: "migration" });
      assert.deepEqual(migrated.find(q => q.id === edited.id), edited);
      assert.ok(migrated.some(q => q.id === added.id));
      assert.ok(!migrated.some(q => q.id === first.at(-1).id), "adopting an existing database must not restore deleted defaults");
      assert.equal((await request("/api/tests", { worker: "migration" })).data.tests[0].reportPriceCents, 500, "fresh isolates must not reset admin pricing");
    });

    let savedReport;
    await t.test("new reports use saved interpretations; existing report snapshots remain unchanged", async () => {
      const published = await questions();
      const result = await request("/api/submit", { method: "POST", body: {
        sessionId: crypto.randomUUID(), testId: originalTest.id, email: "qa-catalog@deeppersonaai.com",
        answerChoices: Object.fromEntries(published.map(q => [q.id, 0])),
      } });
      assert.equal(result.status, 200, JSON.stringify(result.data));
      const row = await db.prepare("SELECT snapshot_json FROM quiz_reports WHERE id = ?").bind(result.data.reportId).first();
      const snapshot = JSON.parse(row.snapshot_json);
      savedReport = { id: result.data.reportId, profileCookie: result.headers.get("set-cookie").split(";")[0], snapshot: row.snapshot_json };
      assert.ok(snapshot.questions.some(q => q.id === added.id));
      assert.deepEqual(snapshot.questions.find(q => q.id === edited.id), edited);
      assert.ok(snapshot.deepResult.romanceEssay, "a custom question ID must not downgrade the full report");
      await save({ ...edited, prompt: "ADMIN: Changed after report was saved" });
      assert.equal((await db.prepare("SELECT snapshot_json FROM quiz_reports WHERE id = ?").bind(result.data.reportId).first()).snapshot_json, row.snapshot_json);
    });

    await t.test("deleting a test removes its questions, retains paid reports/orders and leaves other tests intact", async () => {
      const otherTest = { ...editedTest, id: "another-test", title: "Another test" };
      await saveTest(otherTest);
      await save({ ...added, id: "other-test-question", testId: otherTest.id });
      for (const route of ["/api/tests", "/api/questions"]) {
        const id = route.endsWith("tests") ? originalTest.id : edited.id;
        assert.equal((await request(route + "?id=" + id, { method: "DELETE" })).status, 401);
        assert.equal((await request(route + "?id=" + id, { method: "DELETE", admin: true, origin: "https://evil.example" })).status, 403);
        assert.equal((await request(route, { method: "DELETE", admin: true })).status, 400);
        assert.equal((await request(route + "?id=" + "x".repeat(101), { method: "DELETE", admin: true })).status, 400);
      }
      assert.equal((await questions()).length, 20, "rejected deletions must not change content");
      // Isolated fixture only: simulate a confirmed sandbox order without charging.
      const orderId = crypto.randomUUID();
      await db.prepare("INSERT INTO payment_orders (id,report_id,amount_cents,livemode,status) VALUES (?,?,500,0,'paid')").bind(orderId, savedReport.id).run();
      const deleted = await request("/api/tests?id=" + originalTest.id, { method: "DELETE", admin: true });
      assert.equal(deleted.status, 200);
      assert.deepEqual(await questions({ admin: true }), []);
      assert.ok(!(await request("/api/tests?all=1", { admin: true })).data.tests.some(item => item.id === originalTest.id));
      assert.equal((await db.prepare("SELECT COUNT(*) AS total FROM quiz_questions WHERE test_id=?").bind(otherTest.id).first()).total, 1);
      assert.equal((await db.prepare("SELECT snapshot_json FROM quiz_reports WHERE id=?").bind(savedReport.id).first()).snapshot_json, savedReport.snapshot);
      assert.equal((await db.prepare("SELECT status FROM payment_orders WHERE id=?").bind(orderId).first()).status, "paid");
      const retained = await request("/api/reports/" + savedReport.id, { profileCookie: savedReport.profileCookie });
      assert.equal(retained.status, 200);
      assert.equal(retained.data.unlocked, true);
      assert.equal(retained.data.questions.length, 20);
      assert.equal((await request("/api/tests?id=" + originalTest.id, { method: "DELETE", admin: true })).status, 200, "retrying a deletion is safe");
      assert.deepEqual(await questions({ admin: true, worker: "restart" }), [], "deleted tests and questions must not reappear in a fresh isolate");
    });

    await t.test("an intentionally empty catalog stays empty after a fresh Worker starts", async () => {
      for (const question of (await request("/api/questions?all=1", { admin: true })).data.questions) {
        assert.equal((await request("/api/questions?id=" + question.id, { method: "DELETE", admin: true })).status, 200);
      }
      for (const item of (await request("/api/tests?all=1", { admin: true })).data.tests) {
        assert.equal((await request("/api/tests?id=" + item.id, { method: "DELETE", admin: true })).status, 200);
      }
      assert.deepEqual(await questions({ admin: true, worker: "empty-restart" }), []);
      assert.deepEqual((await request("/api/tests", { worker: "empty-restart" })).data.tests, []);
    });
  } finally { await mf.dispose(); }
});
