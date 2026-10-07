import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';

const bundle = buildSync({ stdin: { contents: "export * from './lib/attachment-launch-story'; export * from './lib/attachment-launch-report'; export * from './lib/attachment-launch-questions'; export * from './lib/report-preview';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' }).outputFiles[0].text;
const { launchQuestions: qs, enrichLaunchReport, buildLaunchReport, reportPreview } = await import('data:text/javascript;base64,' + Buffer.from(bundle).toString('base64'));
const choices = (style) => Object.fromEntries(qs.map(q => [q.id, q.options.findIndex(o => o.styleKey === style)]));
const make = (style) => ({ test: { id: 'attachment-style' }, questions: qs, answerChoices: choices(style), ...buildLaunchReport(qs, choices(style)) });

test('the same situation has a different reading for each selected reaction', () => {
  const readings = ['anxious','avoidant','secure','fearful'].map(style => make(style).deepResult.launchReport);
  assert.equal(new Set(readings.map(r => r.overview.insight.title)).size, 4);
  assert.equal(new Set(readings.map(r => r.scenarios[0].reading)).size, 4);
  for (const r of readings) {
    assert.equal(r.reading.version, 'attachment-reading-v2');
    assert.equal(new Set(r.overview.insight.chapters.map(c => c.question)).size, 3);
    assert.deepEqual(r.overview.insight.chapters.map(c => c.questionId), r.scenarios.map(s => s.evidence.questionId));
    for (const e of r.overview.insight.evidence) assert.ok(r.answers.some(a => a.questionId === e.questionId && a.answer === e.answer));
    assert.ok(r.reading.need && r.reading.protection && r.reading.cost && r.reading.misread && r.reading.pivot);
  }
  assert.match(readings[2].overview.insight.opening, /clarity and follow-through/);
  assert.doesNotMatch(readings[2].overview.insight.excerpt, /checking and more messages|exposure of making a direct request/);
});

test('all 20 situations use selected reactions and distinct context, including reordered questions', () => {
  for (const style of ['anxious','avoidant','secure','fearful']) {
    const texts = new Set();
    for (const first of qs) {
      const ordered = [first, ...qs.filter(q => q.id !== first.id)];
      const r = buildLaunchReport(ordered, choices(style)).deepResult.launchReport;
      assert.equal(r.scenarios[0].evidence.questionId, first.id);
      assert.equal(r.scenarios[0].evidence.answer, first.options.find(o => o.styleKey === style).label);
      texts.add(r.scenarios[0].reading);
    }
    assert.equal(texts.size, 20);
  }
});

test('mixed answers stay contextual and managed rewrites do not inherit the original scenario interpretation', () => {
  const mixed = Object.fromEntries(qs.map((q, i) => [q.id, i % 4]));
  const r = buildLaunchReport(qs, mixed).deepResult.launchReport;
  assert.match(r.overview.insight.title, /reactions change/);
  assert.ok(r.overview.insight.contrastEvidence);
  assert.equal(r.overview.insight.contrastEvidence.answer, qs.find(q => q.id === r.overview.insight.contrastEvidence.questionId).options[mixed[r.overview.insight.contrastEvidence.questionId]].label);
  for (const field of ['prompt', 'option']) {
    const edited = structuredClone(qs);
    if (field === 'prompt') edited[0].prompt = 'A different managed situation';
    else edited[0].options[0].label = 'A different managed response';
    const changed = buildLaunchReport(edited, choices('anxious')).deepResult.launchReport;
    assert.doesNotMatch(changed.scenarios[0].reading, /shorter reply leads to checking/);
    assert.doesNotMatch(changed.overview.insight.excerpt, /shorter reply leads to checking/);
  }
});

test('saved V1 answers can gain an additive reading without mutating their snapshot', () => {
  const original = make('anxious').deepResult.launchReport;
  delete original.reading; delete original.overview.insight;
  const frozen = JSON.stringify(original);
  const upgraded = enrichLaunchReport(original);
  assert.equal(JSON.stringify(original), frozen);
  assert.deepEqual(upgraded.answers, original.answers);
  assert.deepEqual(upgraded.overview.counts, original.overview.counts);
  assert.deepEqual(upgraded.scenarios.map(s => s.sentence), original.scenarios.map(s => s.sentence));
  assert.equal(enrichLaunchReport(upgraded), upgraded, 'a saved reading version is stable');
});

test('unpaid preview and shipped client never include the full interpretation', () => {
  const snapshot = make('anxious'), full = snapshot.deepResult.launchReport;
  const preview = JSON.stringify(reportPreview(snapshot));
  assert.ok(preview.includes(full.overview.insight.excerpt), 'the free reading contains an actual personalized excerpt');
  for (const paid of [full.reading.protection, full.reading.cost, full.reading.misread, full.reading.relationship[0].body, full.scenarios[0].sentence]) {
    assert.ok(!preview.includes(paid), 'paid passage must stay behind the entitlement check');
    for (const file of readdirSync('dist/client', { recursive: true }).filter(f => f.endsWith('.js'))) {
      assert.ok(!readFileSync('dist/client/' + file, 'utf8').includes(paid), file);
    }
  }
});
