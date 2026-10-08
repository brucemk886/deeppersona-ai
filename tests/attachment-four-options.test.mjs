import assert from 'node:assert/strict';
import test from 'node:test';
import {buildSync} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const bundle=buildSync({stdin:{contents:"export {fixedQuestions,fixedTemplates} from './lib/attachment-fixed-content';export {restoreRetiredCoreSkips} from './lib/attachment-fixed-compat';export {fixedValidation} from './lib/attachment-fixed';export {buildFixedReport} from './lib/attachment-fixed-report';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {fixedQuestions:original,fixedTemplates,restoreRetiredCoreSkips,fixedValidation,buildFixedReport}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
const current=original.map(q=>q.reportConfig.kind==='core'?{...q,options:q.options.slice(0,4)}:q);
test('four core choices score all fourteen reactions and background stays unscored',()=>{
 assert.equal(current.flatMap(q=>q.options).length,87);
 for(const q of current)assert.equal(fixedValidation(q),null);
 for(const key of ['anxious','avoidant','secure','fearful']){
  const choices=Object.fromEntries(current.map(q=>[q.id,q.reportConfig.kind==='core'?q.options.findIndex(o=>o.styleKey===key):q.options.length-1]));
  const full=buildFixedReport(current,choices,fixedTemplates).deepResult.fixedReport;
  assert.equal(full.overview.primary,key);assert.equal(full.overview.validCore,14);assert.equal(full.overview.counts[key],14);assert.equal(full.origins.length,0);
 }
 const background=structuredClone(current[16]);background.options=background.options.slice(0,4);assert.ok(fixedValidation(background));
});
test('only the exact retired selected option can complete an already-loaded page',()=>{
 const choices=Object.fromEntries(current.map(q=>[q.id,q.reportConfig.kind==='core'?4:q.options.length-1]));
 const ids=Object.fromEntries(original.map(q=>[q.id,q.options[choices[q.id]].optionId]));
 const restored=restoreRetiredCoreSkips(current,choices,ids);
 assert.equal(restored.filter(q=>q.reportConfig.kind==='core').every(q=>q.options.length===5),true);
 const result=buildFixedReport(restored,choices,fixedTemplates).deepResult.fixedReport;
 assert.equal(result.overview.state,'insufficient');assert.equal(result.overview.validCore,0);
 assert.equal(current[0].options.length,4,'does not mutate the managed current bank');
 assert.equal(restoreRetiredCoreSkips(current,choices)[0].options.length,4);
 assert.equal(restoreRetiredCoreSkips(current,choices,{...ids,[current[0].id]:'made-up'})[0].options.length,4);
 const changed=current.map(q=>({...q,testId:'different-test'}));assert.equal(restoreRetiredCoreSkips(changed,choices,ids)[0].options.length,4);
});
test('scoped removal preserves managed wording, backgrounds and reports and fails closed on unexpected rows',()=>{
 const sql=readFileSync('db/releases/2026-10-08-attachment-core-four-options.sql','utf8');
 for(const mode of ['normal','missing','unexpected-fifth']){
  const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE quiz_questions(id TEXT PRIMARY KEY,test_id TEXT,active INT,report_config_json TEXT,options_json TEXT,updated_at TEXT);CREATE TABLE quiz_catalog_migrations(id TEXT PRIMARY KEY);CREATE TABLE quiz_reports(snapshot_json TEXT);INSERT INTO quiz_reports VALUES('historical report');");
  for(const q of original){const options=structuredClone(q.options);options[0].label='Admin wording '+q.id;db.prepare('INSERT INTO quiz_questions VALUES(?,?,?,?,?,NULL)').run(q.id,q.testId,1,JSON.stringify(q.reportConfig),JSON.stringify(options));}
  if(mode==='missing')db.prepare('UPDATE quiz_questions SET active=0 WHERE id=?').run(original[0].id);
  if(mode==='unexpected-fifth')db.prepare("UPDATE quiz_questions SET options_json=json_set(options_json,'$[4].fixed.tag','different') WHERE id=?").run(original[0].id);
  const before=db.prepare('SELECT id,options_json FROM quiz_questions').all();db.exec(sql);db.exec(sql);
  for(const row of before){const options=JSON.parse(db.prepare('SELECT options_json FROM quiz_questions WHERE id=?').get(row.id).options_json),old=JSON.parse(row.options_json);const core=original.find(q=>q.id===row.id).reportConfig.kind==='core';assert.deepEqual(options,mode==='normal'&&core?old.slice(0,4):old);}
  assert.equal(db.prepare('SELECT snapshot_json FROM quiz_reports').get().snapshot_json,'historical report');assert.equal(db.prepare('SELECT COUNT(*) n FROM quiz_catalog_migrations').get().n,mode==='normal'?1:0);db.close();
 }
});