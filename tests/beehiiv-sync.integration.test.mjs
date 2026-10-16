import assert from "node:assert/strict";
import test from "node:test";
import { Miniflare } from "miniflare";
import { buildSync } from "esbuild";

// Real sync code against local D1. Only the beehiiv API is mocked.
test("beehiiv sync: new consented astro emails only, with fields, retries and no backfill", async () => {
  const script = buildSync({ stdin: { contents: "import { syncBeehiiv } from './lib/beehiiv-sync'; export default { async fetch(request) { const now = Number(new URL(request.url).searchParams.get('now')) || Date.now(); return Response.json(await syncBeehiiv(now)); } }", resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "browser", external: ["cloudflare:workers"] }).outputFiles[0].text;
  const mock = `
    const calls = []; let mode = 'ok';
    export default { async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === '/__calls') return Response.json(calls);
      if (url.pathname === '/__mode') { mode = await request.text(); return new Response('ok'); }
      const body = await request.json();
      calls.push({ url: url.href, auth: request.headers.get('authorization'), body });
      if (mode === 'down') return new Response('down', { status: 503 });
      if (mode === 'fields' && body.custom_fields) return Response.json({ errors: [{ message: 'custom field' }] }, { status: 400 });
      return Response.json({ data: { id: 'sub_' + calls.length, email: body.email } }, { status: 201 });
    } };`;
  const mf = new Miniflare({ workers: [
    { name: "sync", modules: true, script, compatibilityDate: "2026-05-22", compatibilityFlags: ["nodejs_compat"], d1Databases: { DB: "beehiiv-test-db" },
      bindings: { BEEHIIV_API_KEY: "bh_fixture", BEEHIIV_PUBLICATION_ID: "pub_fixture" }, outboundService: "beehiiv-mock" },
    { name: "beehiiv-mock", modules: true, script: mock, compatibilityDate: "2026-05-22" },
  ] });
  try {
    const db = await mf.getD1Database("DB", "sync");
    const worker = await mf.getWorker("sync");
    const beehiiv = await mf.getWorker("beehiiv-mock");
    const run = async (now = Date.now()) => (await worker.fetch(`http://sync/?now=${now}`)).json();
    const calls = async () => (await beehiiv.fetch("http://mock/__calls")).json();
    await db.batch([
      db.prepare("CREATE TABLE quiz_sessions (id TEXT PRIMARY KEY, profile_id TEXT, test_id TEXT, email TEXT, marketing_consent INTEGER NOT NULL DEFAULT 0, answers_json TEXT, result_type TEXT, source TEXT, campaign TEXT, current_step INTEGER NOT NULL DEFAULT 0, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT)"),
      db.prepare("CREATE TABLE quiz_reports (id TEXT PRIMARY KEY, session_id TEXT NOT NULL UNIQUE, profile_id TEXT NOT NULL, test_id TEXT NOT NULL, email TEXT NOT NULL, snapshot_json TEXT NOT NULL, free INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
      // Collected before beehiiv was connected: must never be sent (no backfill).
      db.prepare("INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('old', 'astro-reading', 'old@example.com', 1, '2020-01-01 00:00:00')"),
    ]);
    assert.deepEqual(await run(), { skipped: false, synced: 0, failed: 0 });

    const snapshot = JSON.stringify({ chart: { sun: { name: "Gemini" } }, profile: { type: "The Mystery", partner: { name: "Scorpio" } }, input: { answers: { someone: "Someone I'm talking to", gender: "Female" } } });
    const later = "datetime('now', '+1 minute')";
    await db.batch([
      db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, source, campaign, completed_at) VALUES ('new', 'astro-reading', 'emma@example.com', 1, 'tiktok', 'acc12', ${later})`),
      db.prepare("INSERT INTO quiz_reports (id, session_id, profile_id, test_id, email, snapshot_json) VALUES ('r1', 'new', 'p', 'astro-reading', 'emma@example.com', ?)").bind(snapshot),
      db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('own', 'astro-reading', 'test+ci@DeepPersonaAI.com', 1, ${later})`),
      db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('marked', 'astro-reading', 'qa@example.com', 1, ${later})`),
      db.prepare("INSERT INTO admin_test_sessions (session_id) VALUES ('marked')"),
      db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('psych', 'attachment-style', 'psych@example.com', 1, ${later})`),
      db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('noconsent', 'astro-reading', 'no@example.com', 0, ${later})`),
      db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('open', 'astro-reading', 'open@example.com', 1, NULL)`),
    ]);
    assert.deepEqual(await run(), { skipped: false, synced: 1, failed: 0 });
    const [call] = await calls();
    assert.equal(call.url, "https://api.beehiiv.com/v2/publications/pub_fixture/subscriptions");
    assert.equal(call.auth, "Bearer bh_fixture");
    assert.equal(call.body.email, "emma@example.com");
    assert.equal(call.body.send_welcome_email, true);
    assert.equal(call.body.reactivate_existing, false, "people who unsubscribed are not re-added");
    assert.equal(call.body.utm_source, "tiktok");
    assert.equal(call.body.utm_campaign, "acc12");
    assert.deepEqual(call.body.custom_fields, [
      { name: "sun_sign", value: "Gemini" }, { name: "love_type", value: "The Mystery" }, { name: "on_mind", value: "Someone I'm talking to" },
      { name: "partner_sign", value: "Scorpio" }, { name: "gender", value: "Female" },
    ]);
    // Synced once: the next run sends nothing.
    assert.deepEqual(await run(), { skipped: false, synced: 0, failed: 0 });
    assert.equal((await calls()).length, 1);

    // Missing custom fields in beehiiv: the email is still added, without fields.
    await beehiiv.fetch("http://mock/__mode", { method: "POST", body: "fields" });
    await db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('f', 'astro-reading', 'f@example.com', 1, ${later})`).run();
    assert.deepEqual(await run(), { skipped: false, synced: 1, failed: 0 });
    assert.equal((await calls()).at(-1).body.custom_fields, undefined);

    // beehiiv down: kept for retry with backoff, then sent once it's back.
    await beehiiv.fetch("http://mock/__mode", { method: "POST", body: "down" });
    await db.prepare(`INSERT INTO quiz_sessions (id, test_id, email, marketing_consent, completed_at) VALUES ('d', 'astro-reading', 'd@example.com', 1, ${later})`).run();
    assert.deepEqual(await run(), { skipped: false, synced: 0, failed: 1 });
    const retry = await db.prepare("SELECT status, attempts, last_error FROM beehiiv_sync WHERE session_id = 'd'").first();
    assert.equal(retry.status, "retry");
    assert.match(retry.last_error, /HTTP 503/);
    assert.deepEqual(await run(), { skipped: false, synced: 0, failed: 0 }, "waits for the backoff");
    await beehiiv.fetch("http://mock/__mode", { method: "POST", body: "ok" });
    assert.deepEqual(await run(Date.now() + 3 * 60000), { skipped: false, synced: 1, failed: 0 });

    const sent = (await calls()).map((c) => c.body.email);
    for (const email of ["old@example.com", "test+ci@DeepPersonaAI.com", "qa@example.com", "psych@example.com", "no@example.com", "open@example.com"]) {
      assert.ok(!sent.includes(email), `${email} must not be sent`);
    }
  } finally {
    await mf.dispose();
  }
});
