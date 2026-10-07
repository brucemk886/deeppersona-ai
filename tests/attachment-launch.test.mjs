import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const bundled=buildSync({stdin:{contents:"export * from './lib/attachment-launch'; export * from './lib/attachment-launch-report'; export * from './lib/report-preview'; export * from './lib/attachment-launch-questions'; export {relationshipQuestions} from './lib/relationship-content';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {launchQuestions:qs,relationshipQuestions:old,buildLaunchReport,optionOrder,reportPreview,freeResultFromSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(bundled).toString('base64'));
const choose=indexes=>Object.fromEntries(qs.map((q,i)=>[q.id,Array.isArray(indexes)?indexes[i]:indexes]));
const make=indexes=>({test:{id:'attachment-style'},questions:qs,answerChoices:choose(indexes),...buildLaunchReport(qs,choose(indexes))});
test('launch edition balances domains, stores canonical choices and varies stable display order',()=>{
 assert.equal(qs.length,20);assert.equal(new Set(qs.map(q=>q.id)).size,20);
 assert.equal(new Set(qs.flatMap(q=>q.options.map(o=>o.label))).size,80);
 for(const domain of new Set(qs.map(q=>q.kicker))) assert.equal(qs.filter(q=>q.kicker===domain).length,4);
 const orders=new Set();
 for(let i=0;i<40;i++) {const a=optionOrder(`session-${i}`,qs[0].id,4);assert.deepEqual(a,optionOrder(`session-${i}`,qs[0].id,4));assert.deepEqual(a.slice().sort(),[0,1,2,3]);orders.add(a.join(','));}
 assert.ok(orders.size>12);assert.deepEqual(optionOrder('x',old[0].id,4),[0,1,2,3]);
});
test('ties and close counts do not invent a type, clinical score or self-worth number',()=>{
 for(const indexes of [[...Array(10).fill(0),...Array(10).fill(1)],[...Array(6).fill(0),...Array(5).fill(1),...Array(5).fill(2),...Array(4).fill(3)]]){
 const s=make(indexes),o=s.deepResult.launchReport.overview;
 assert.equal(s.result.key,'choices');assert.equal(s.result.title,o.headline);assert.equal(Object.values(o.counts).reduce((a,b)=>a+b),20);
 assert.equal(s.result.anxiety,undefined);assert.equal(s.deepResult.selfWorth,undefined);assert.equal(reportPreview(s).selfWorth,undefined);
 }
 assert.equal(make([...Array(10).fill(0),...Array(10).fill(1)]).deepResult.launchReport.overview.counts.fearful,0);
});
test('steady answers receive matching evidence and paid tools without an invented anxious problem',()=>{
 const s=make(2),full=s.deepResult.launchReport;
 assert.equal(s.result.key,'secure');assert.equal(full.overview.counts.secure,20);assert.equal(full.overview.exception,undefined);
 assert.doesNotMatch(JSON.stringify(s),/proof that you are still chosen|selfWorth|self-worth|anxietySeven/);
 assert.equal(full.scenarios.length,3);assert.equal(new Set(full.scenarios.map(x=>x.evidence.domain)).size,3);
 assert.ok(full.scenarios.every(x=>x.evidence.response==='secure'&&x.sentence&&x.condition&&x.observation));
 assert.equal(full.answers.length,20);assert.equal(full.domains.length,5);
});
test('free projection excludes paid tools and all-answers review; snapshots keep selected evidence',()=>{
 const s=make(Array.from({length:20},(_,i)=>i%4)),preview=reportPreview(s),free=freeResultFromSnapshot(s);
 assert.equal(free.title,s.result.title);assert.equal(preview.launchOverview.evidence.length,3);
 assert.equal(preview.launchOverview.version,'attachment-launch-v1');
 assert.ok(!JSON.stringify(preview).includes('scenarios'));assert.ok(!JSON.stringify(preview).includes('practice'));assert.ok(!JSON.stringify(preview).includes('sentence'));
 for(const e of s.deepResult.launchReport.answers) assert.equal(e.answer,qs.find(q=>q.id===e.questionId).options[s.answerChoices[e.questionId]].label);
 const edited=structuredClone(qs).reverse();edited[0].prompt='A completely different admin scenario';
 const report=buildLaunchReport(edited,choose(0)).deepResult.launchReport;
 assert.equal(report.scenarios[0].evidence.prompt,'A completely different admin scenario');
 assert.equal(report.scenarios[0].sentence,'Could we talk about what would work for both of us?','admin rewrites must not receive an unrelated original script');
});
test('explicit catalog rollout switches exactly one bank, preserves history, and fails closed on admin edits',()=>{
 const sql=readFileSync('db/releases/2026-10-07-attachment-launch-v1.sql','utf8');
 for(const edited of [false,true]){
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE quiz_questions(id TEXT PRIMARY KEY,test_id TEXT,kicker TEXT,prompt TEXT,atlas_path TEXT,options_json TEXT,position INT,active INT,updated_at TEXT); CREATE TABLE quiz_tests(id TEXT PRIMARY KEY,title TEXT,kicker TEXT,description TEXT,presentation_mode TEXT,active INT,report_price_cents INT,updated_at TEXT); CREATE TABLE quiz_catalog_migrations(id TEXT PRIMARY KEY); CREATE TABLE quiz_reports(snapshot_json TEXT); INSERT INTO quiz_reports VALUES ('historical paid snapshot'); INSERT INTO quiz_tests (id,active,report_price_cents) VALUES ('attachment-style',1,999);");
 for(const q of old) db.prepare('INSERT INTO quiz_questions(id,test_id,kicker,prompt,atlas_path,options_json,position,active) VALUES (?,?,?,?,?,?,?,1)').run(q.id,q.testId,q.kicker,q.prompt,q.atlasPath,JSON.stringify(q.options),q.position);
 if(edited) db.prepare('UPDATE quiz_questions SET prompt=? WHERE id=?').run('Admin changes must survive',old[0].id);
 db.exec(sql);
 const active=db.prepare('SELECT id FROM quiz_questions WHERE active=1 ORDER BY position').all().map(x=>x.id);
 assert.deepEqual(active,(edited?old:qs).map(q=>q.id));
 assert.equal(db.prepare('SELECT snapshot_json FROM quiz_reports').get().snapshot_json,'historical paid snapshot');
 if(!edited){db.exec(sql);assert.equal(db.prepare('SELECT COUNT(*) n FROM quiz_questions WHERE active=1').get().n,20);assert.equal(db.prepare('SELECT COUNT(*) n FROM quiz_questions').get().n,40);}
 db.close();
 }
});

test('paid launch tools are absent from shipped client bundles',()=>{
 for(const file of readdirSync('dist/client',{recursive:true}).filter(f=>f.endsWith('.js'))) {
   const source=readFileSync('dist/client/'+file,'utf8');
   assert.ok(!source.includes('Help with this one thing would make a difference'),file);
   assert.ok(!source.includes('I want to understand the impact before explaining my intention'),file);
 }
});
