import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { readFileSync,readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const bundle=buildSync({stdin:{contents:"export * from './lib/attachment-fixed';export * from './lib/attachment-fixed-report';export * from './lib/attachment-fixed-content';export * from './lib/report-preview';export * from './lib/public-quiz';export {optionOrder} from './lib/attachment-launch';export {launchQuestions} from './lib/attachment-launch-questions';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {fixedQuestions:qs,fixedTemplates:templates,buildFixedReport,fixedValidation,validTemplates,reportPreview,publicQuestion,optionOrder,launchQuestions}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
const choose=(style,background='skip')=>Object.fromEntries(qs.map(q=>[q.id,q.reportConfig.kind==='core'?q.options.findIndex(o=>o.styleKey===style):background==='skip'?q.options.findIndex(o=>o.fixed.tag==='skip'):background]));
const report=(choices)=>buildFixedReport(qs,choices,templates).deepResult.fixedReport;

test('fixed edition covers every approved option and keeps background out of all four scores',()=>{
 assert.equal(qs.length,20);assert.equal(qs.flatMap(q=>q.options).length,101);assert.equal(validTemplates(templates),true);
 assert.equal(qs.filter(q=>q.reportConfig.kind==='core').length,14);
 const optionIds=new Set(qs.flatMap(q=>q.options.map(o=>o.optionId)));assert.equal(optionIds.size,101);
 for(const q of qs){assert.equal(fixedValidation(q),null);assert.equal(publicQuestion(q).options.some(o=>o.fixed),false);const order=optionOrder('a',q.id,q.options.length);assert.deepEqual(order.slice(4),Array.from({length:q.options.length-4},(_,i)=>i+4));}
 for(const style of ['anxious','avoidant','secure','fearful'])for(const background of ['skip',0,1,2,3]){
  const r=report(choose(style,background));assert.equal(r.overview.primary,style);assert.equal(r.overview.counts[style],14);assert.equal(r.overview.validCore,14);assert.ok(r.overview.evidence.length>=3);assert.ok(r.overview.evidence.every(a=>a.response===style));assert.equal(r.overview.evidence.some(a=>a.questionNumber===11),false);
  if(background==='skip')assert.equal(r.origins.length,0);
 }
});
test('ties stay mixed; missing evidence suppresses offers; no family story is guessed from type',()=>{
 const choices=choose('anxious');qs.slice(7,14).forEach(q=>choices[q.id]=1);
 const mixed=report(choices);assert.equal(mixed.overview.state,'mixed');assert.equal(mixed.overview.primary,null);assert.equal(mixed.overview.counts.fearful,0);assert.equal(mixed.origins.length,0);
 const skipped=Object.fromEntries(qs.map(q=>[q.id,q.options.findIndex(o=>o.fixed.tag==='skip')]));const r=report(skipped);assert.equal(r.overview.state,'insufficient');assert.deepEqual(r.overview.riskPreviews,[]);assert.deepEqual(r.overview.evidence,[]);
 const missingDomain=choose('anxious');for(const q of qs.filter(q=>q.reportConfig.domain==='Stability and trust'))missingDomain[q.id]=q.options.length-1;assert.equal(report(missingDomain).overview.state,'insufficient');
 const family=choose('avoidant');family[qs[16].id]=2;family[qs[17].id]=2;const supported=report(family);assert.equal(supported.origins.length,1);assert.equal(supported.origins[0].evidence.length,2);assert.match(supported.origins[0].paragraphs[0],/asking does not change much/);
 const secure=choose('secure');secure[qs[16].id]=2;assert.doesNotMatch(report(secure).origins[0].paragraphs[0],/depending on someone may rarely feel/);
});
test('actual background chooses specific loops and unpaid preview never contains paid paragraphs',()=>{
 const c=choose('anxious',0);const partner=qs[14].options.findIndex(o=>o.fixed.tag==='partner_disappears');assert.ok(partner>=0);c[qs[14].id]=partner;
 const built=buildFixedReport(qs,c,templates),r=built.deepResult.fixedReport;assert.equal(r.risks[0].id,'cycle-pursue-withdraw');
 const p=reportPreview({test:{id:'attachment-style'},questions:qs.map(publicQuestion),answerChoices:c,...built});assert.equal(p.fixedOverview.primary,'anxious');assert.equal(p.fixedOverview.riskPreviews.length,3);
 assert.equal(JSON.stringify(p).includes(r.risks[0].paragraphs[0]),false);assert.equal(JSON.stringify(p).includes(r.deeper[0].paragraphs[0]),false);assert.equal(p.fixedOverview.answers,undefined);
 const bad=structuredClone(qs[0]);bad.options[0].optionId='different';assert.ok(fixedValidation(bad));
 const badBackground=structuredClone(qs[16]);badBackground.options[0].styleKey='anxious';assert.ok(fixedValidation(badBackground));
});
test('fixed migration is atomic at the bank switch, preserves snapshots and does not clobber managed edits',()=>{
 const sql=readFileSync('db/releases/2026-10-08-attachment-fixed-v2.sql','utf8');
 for(const mode of ['normal','edited-v1','edited-v2','deleted-v1']){
  const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE quiz_questions(id TEXT PRIMARY KEY,test_id TEXT,kicker TEXT,prompt TEXT,atlas_path TEXT,options_json TEXT,report_config_json TEXT,position INT,active INT,updated_at TEXT);CREATE TABLE quiz_tests(id TEXT PRIMARY KEY,title TEXT,kicker TEXT,description TEXT,presentation_mode TEXT,active INT,report_price_cents INT,updated_at TEXT);CREATE TABLE quiz_catalog_migrations(id TEXT PRIMARY KEY);CREATE TABLE quiz_report_templates(version TEXT PRIMARY KEY,revision INT,content_json TEXT);CREATE TABLE quiz_reports(snapshot_json TEXT);INSERT INTO quiz_reports VALUES('old purchased snapshot');INSERT INTO quiz_tests(id,active,report_price_cents) VALUES('attachment-style',1,999);");
  const insert=q=>db.prepare('INSERT INTO quiz_questions(id,test_id,kicker,prompt,atlas_path,options_json,report_config_json,position,active) VALUES(?,?,?,?,?,?,?,?,?)').run(q.id,q.testId,q.kicker,q.prompt,q.atlasPath,JSON.stringify(q.options),q.reportConfig?JSON.stringify(q.reportConfig):null,q.position,q.active?1:0);
  launchQuestions.forEach(insert);
  if(mode==='edited-v1')db.prepare('UPDATE quiz_questions SET prompt=? WHERE id=?').run('Managed edit',launchQuestions[0].id);
  if(mode==='edited-v2')insert({...qs[0],active:false,prompt:'Managed staged edit'});
  if(mode==='deleted-v1')db.prepare('DELETE FROM quiz_questions WHERE id=?').run(launchQuestions[0].id);
  db.exec(sql);const active=db.prepare('SELECT id FROM quiz_questions WHERE active=1 ORDER BY position').all().map(q=>q.id);
  assert.deepEqual(active,mode==='normal'?qs.map(q=>q.id):launchQuestions.filter((q,i)=>mode!=='deleted-v1'||i!==0).map(q=>q.id));assert.equal(db.prepare('SELECT snapshot_json FROM quiz_reports').get().snapshot_json,'old purchased snapshot');
  if(mode==='normal'){db.prepare('UPDATE quiz_questions SET prompt=? WHERE id=?').run('Saved later',qs[0].id);db.exec(sql);assert.equal(db.prepare('SELECT prompt FROM quiz_questions WHERE id=?').get(qs[0].id).prompt,'Saved later');assert.equal(db.prepare('SELECT COUNT(*) n FROM quiz_questions WHERE active=1').get().n,20);}
  db.close();
 }
});
test('fixed paid corpus is absent from client bundles',()=>{
 const paragraphs=Object.values(templates.profiles).flatMap(p=>[...p.risks,...p.deeper].flatMap(b=>b.paragraphs));
 for(const f of readdirSync('dist/client',{recursive:true}).filter(f=>f.endsWith('.js'))){const text=readFileSync('dist/client/'+f,'utf8');for(const p of paragraphs)assert.equal(text.includes(p.slice(0,90)),false,f);assert.equal(text.includes('family_help_unavailable'),false,f);}
});