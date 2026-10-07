import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSync } from 'esbuild';
import { Miniflare } from 'miniflare';

test('quiz submission: edited email, repeat attempts and retained previous edition', async () => {
  const mf = new Miniflare({ host: '127.0.0.1', port: 0, inspectorPort: 0,
    modules: ['index.js', ...readdirSync('dist/server', { recursive: true }).filter(p => p.endsWith('.js') && p !== 'index.js')]
      .map(p => ({ type: 'ESModule', path: resolve('dist/server', p) })),
    modulesRoot: resolve('dist/server'), compatibilityDate: '2026-05-22', compatibilityFlags: ['nodejs_compat'],
    d1Databases: ['DB'], outboundService: () => Response.json({ error: 'External services disabled' }, { status: 503 }),
  });
  try {
    const base = new URL(await mf.ready).origin, db = await mf.getD1Database('DB');
    const call = async (path, body, cookie) => {
      const res = await fetch(base + path, { method: body ? 'POST' : 'GET',
        headers: { origin: base, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
      return { status: res.status, headers: res.headers, data: await res.json() };
    };
    const testId = 'attachment-style';
    const active = (await call('/api/questions?test=' + testId)).data.questions;
    const choices = Object.fromEntries(active.map(q => [q.id, 0]));
    const body = { sessionId: crypto.randomUUID(), testId, email: 'qa-first@deeppersonaai.com', answerChoices: choices };
    const first = await call('/api/submit', body);
    assert.equal(first.status, 200, JSON.stringify(first.data));
    const cookie = first.headers.get('set-cookie').split(';')[0];
    const original = await db.prepare('SELECT * FROM quiz_reports WHERE id=?').bind(first.data.reportId).first();
    // Each new quiz attempt can use a new email on the same browser profile.
    const nextBody = { ...body, sessionId: crypto.randomUUID(), email: 'qa-edited@deeppersonaai.com' };
    const second = await call('/api/submit', nextBody, cookie);
    assert.equal(second.status, 200, JSON.stringify(second.data));
    assert.notEqual(second.data.reportId, first.data.reportId);
    assert.equal(second.data.profile.email, nextBody.email);
    for (const table of ['quiz_reports', 'quiz_sessions']) {
      assert.equal((await db.prepare(`SELECT email FROM ${table} WHERE ${table === 'quiz_reports' ? 'session_id' : 'id'}=?`).bind(nextBody.sessionId).first()).email, nextBody.email);
    }
    assert.deepEqual(await db.prepare('SELECT * FROM quiz_reports WHERE id=?').bind(first.data.reportId).first(), original, 'previous report and delivery address stay unchanged');
    const retry = await call('/api/submit', nextBody, cookie);
    assert.equal(retry.status, 200);
    assert.equal(retry.data.reportId, second.data.reportId);
    assert.equal((await db.prepare("SELECT COUNT(*) n FROM quiz_events WHERE session_id=? AND event_name='email_submitted'").bind(nextBody.sessionId).first()).n, 1);
    assert.equal((await call('/api/submit', { ...nextBody, email: 'qa-third@deeppersonaai.com' }, cookie)).status, 409, 'retry cannot silently change an existing report address');
    assert.equal((await call('/api/submit', nextBody)).status, 409, 'another browser cannot claim the saved result');
    assert.equal((await call('/api/submit', { ...nextBody, sessionId: crypto.randomUUID(), email: 'invalid' }, cookie)).status, 400);
    assert.equal((await call('/api/profile', undefined, cookie)).data.email, nextBody.email);

    // Simulate the actual release: the old bank remains in D1, inactive.
    const bundle = buildSync({ entryPoints: ['lib/relationship-content.ts'], bundle: true, write: false, format: 'esm', platform: 'node' }).outputFiles[0].text;
    const { relationshipQuestions: previous } = await import('data:text/javascript;base64,' + Buffer.from(bundle).toString('base64'));
    await db.batch(previous.map(q => db.prepare('INSERT INTO quiz_questions(id,test_id,kicker,prompt,atlas_path,options_json,position,active) VALUES (?,?,?,?,?,?,?,0)')
      .bind(q.id, q.testId, q.kicker, q.prompt, q.atlasPath, JSON.stringify(q.options), q.position)));
    const previousChoices = Object.fromEntries(previous.map(q => [q.id, 1]));
    // The retained managed text, not source-code defaults, is used in the snapshot.
    await db.prepare('UPDATE quiz_questions SET prompt=? WHERE id=?').bind('Retained managed wording', previous[0].id).run();
    const oldBody = { ...nextBody, sessionId: crypto.randomUUID(), answerChoices: previousChoices };
    const oldSaved = await call('/api/submit', oldBody, cookie);
    assert.equal(oldSaved.status, 200, JSON.stringify(oldSaved.data));
    const oldSnapshot = JSON.parse((await db.prepare('SELECT snapshot_json FROM quiz_reports WHERE id=?').bind(oldSaved.data.reportId).first()).snapshot_json);
    assert.equal(oldSnapshot.questions.length, 20);
    assert.equal(oldSnapshot.questions[0].prompt, 'Retained managed wording');
    assert.deepEqual(oldSnapshot.answerChoices, previousChoices);
    assert.ok(oldSnapshot.questions.every(q => q.id.startsWith('attachment-style-v3-q')));
    assert.equal(oldSnapshot.deepResult.launchReport, undefined, 'old answers are never scored as the launch bank');
    assert.deepEqual((await call('/api/questions?test=' + testId)).data.questions.map(q => q.id), active.map(q => q.id), 'compatibility does not republish the previous bank');
    const invalid = async (answerChoices) => assert.equal((await call('/api/submit', { ...oldBody, sessionId: crypto.randomUUID(), answerChoices }, cookie)).status, 409);
    await invalid({ ...previousChoices, [previous[0].id]: 9 });
    const partial = { ...previousChoices }; delete partial[previous[0].id];
    await invalid(partial);
    await invalid({ ...partial, [active[0].id]: 0 });
    await invalid({ ...choices, unknown: 0 });
    await db.prepare('DELETE FROM quiz_questions WHERE id=?').bind(previous[0].id).run();
    await invalid(previousChoices);
    await db.prepare('UPDATE quiz_tests SET active=0 WHERE id=?').bind(testId).run();
    assert.equal((await call('/api/submit', { ...oldBody, sessionId: crypto.randomUUID() }, cookie)).status, 404, 'disabled tests remain unavailable');
  } finally { await mf.dispose(); }
});
