import assert from 'node:assert/strict';import test from 'node:test';import {buildSync} from 'esbuild';import {readFileSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';
const code=buildSync({stdin:{contents:"export {fixedQuestions,fixedTemplates} from './lib/attachment-fixed-content';export {buildFixedReport} from './lib/attachment-fixed-report';export {currentFixedChoices,hasUsefulFixedReading} from './lib/attachment-fixed';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {fixedQuestions:old,fixedTemplates:templates,buildFixedReport,currentFixedChoices,hasUsefulFixedReading}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const qs=currentFixedChoices(old),keys=['anxious','avoidant','secure','fearful'];
const choicesFor=(styles,bg='skip')=>Object.fromEntries(qs.map((q,i)=>[q.id,i<14?q.options.findIndex(o=>o.styleKey===styles[i]):q.options.findIndex(o=>o.fixed.tag===bg)]));
const report=c=>buildFixedReport(qs,c,templates).deepResult.fixedReport;
test('all 680 complete count vectors select one of four reports independent of question positions',()=>{
 let combinations=0;
 for(let a=0;a<=14;a++)for(let b=0;b<=14-a;b++)for(let c=0;c<=14-a-b;c++){
  const counts=[a,b,c,14-a-b-c],styles=counts.flatMap((n,i)=>Array(n).fill(keys[i]));
  const first=report(choicesFor(styles)),second=report(choicesFor([...styles].reverse()));
  assert.equal(first.overview.state,'primary');assert.equal(first.overview.primary,second.overview.primary);assert.ok(keys.includes(first.overview.primary));
  assert.equal(first.overview.counts[first.overview.primary],Math.max(...counts));assert.equal(first.deeper.length,2);assert.equal(hasUsefulFixedReading(first),true);
  if(counts.filter(n=>n===Math.max(...counts)).length>1)assert.match(first.overview.scoreNote,/equally represented/);
  combinations++;
 }
 assert.equal(combinations,680);
});
test('reliable partner never receives ungrounded broken-promise or one-sided-care chapters',()=>{
 for(const style of keys){const choices=choicesFor(Array(14).fill(style));choices[qs[14].id]=0;choices[qs[15].id]=0;const r=report(choices);
  for(const id of ['secure-promises','secure-one-sided','secure-boundaries','anxious-unfinished','anxious-warmth','anxious-repair','avoidant-pressure','fearful-unpredictable'])assert.equal(r.risks.some(b=>b.id===id),false,id);
  assert.equal(r.overview.familyPreviews.length,0);assert.equal(r.overview.contents.origins,0);assert.equal(r.overview.readingSample.text,r.deeper[0].paragraphs[0]);
 }
 const c=choicesFor(Array(14).fill('secure'));c[qs[15].id]=1;assert.ok(report(c).risks.some(b=>b.id==='secure-promises'));
 const legacy=report(choicesFor(Array(14).fill('anxious')));legacy.overview.state='mixed';legacy.overview.primary=null;assert.equal(hasUsefulFixedReading(legacy),false);
 const thin=report(choicesFor(Array(14).fill('secure')));thin.risks=[];thin.origins=[];thin.deeper=thin.deeper.slice(0,1);assert.equal(hasUsefulFixedReading(thin),false);
});
test('front-end removes only the retired core E without altering backgrounds or selected indexes',()=>{
 assert.ok(qs.slice(0,14).every(q=>q.options.length===4));assert.deepEqual(qs.slice(14),old.slice(14));assert.equal(old[0].options.length,5);
 for(let i=0;i<14;i++)assert.deepEqual(qs[i].options,old[i].options.slice(0,4));
 const other=structuredClone(old);other[0].options[4].optionId='different';assert.equal(currentFixedChoices(other)[0].options.length,5);
});
test('Q1 parallel copy migration is atomic, idempotent and preserves stable scoring and historical reports',()=>{
 const sql=readFileSync('db/releases/2026-10-08-attachment-q1-parallel.sql','utf8');
 for(const mode of ['normal','edited','inactive','wrong-shape']){
  const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE quiz_questions(id TEXT PRIMARY KEY,test_id TEXT,active INT,prompt TEXT,options_json TEXT,report_config_json TEXT,updated_at TEXT);CREATE TABLE quiz_reports(snapshot_json TEXT);INSERT INTO quiz_reports VALUES('saved historical report');");
  for(const q of qs)db.prepare('INSERT INTO quiz_questions VALUES(?,?,?,?,?,?,NULL)').run(q.id,q.testId,1,q.prompt,JSON.stringify(q.options),JSON.stringify(q.reportConfig));
  if(mode==='edited')db.prepare("UPDATE quiz_questions SET options_json=json_set(options_json,'$[0].fixed.reading','Concurrent admin edit') WHERE id=?").run(qs[0].id);
  if(mode==='inactive')db.prepare('UPDATE quiz_questions SET active=0 WHERE id=?').run(qs[0].id);
  if(mode==='wrong-shape')db.prepare('UPDATE quiz_questions SET options_json=? WHERE id=?').run(JSON.stringify(old[0].options),qs[0].id);
  const before=db.prepare('SELECT * FROM quiz_questions ORDER BY id').all();db.exec(sql);db.exec(sql);const after=db.prepare('SELECT * FROM quiz_questions ORDER BY id').all();
  assert.deepEqual(after.slice(1),before.slice(1));
  if(mode!=='normal')assert.deepEqual(after,before);
  else{assert.match(after[0].prompt,/Your partner/);const options=JSON.parse(after[0].options_json);assert.equal(options.length,4);
   for(let i=0;i<4;i++){assert.equal(options[i].optionId,qs[0].options[i].optionId);assert.equal(options[i].styleKey,qs[0].options[i].styleKey);assert.equal(options[i].fixed.tag,qs[0].options[i].fixed.tag);assert.doesNotMatch(options[i].label,/check in|more messages|message again/);}
   assert.match(options[0].label,/urgent need/);assert.match(options[2].label,/partner is busy/);assert.doesNotMatch(options[0].fixed.reading,/another message/);
  }
  assert.equal(db.prepare('SELECT snapshot_json FROM quiz_reports').get().snapshot_json,'saved historical report');db.close();
 }
});