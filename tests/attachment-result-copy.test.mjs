import assert from 'node:assert/strict';
import test from 'node:test';
import {buildSync} from 'esbuild';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const bundled=buildSync({stdin:{contents:"export * from './lib/attachment-result-copy';export {fixedTemplates} from './lib/attachment-fixed-content';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {FIXED_INTRO_REVISIONS:copy,fixedResultIntro,fixedTemplates:templates}=await import('data:text/javascript;base64,'+Buffer.from(bundled).toString('base64'));
test('only exact retired default introductions receive display corrections',()=>{
 for(const [primary,change] of Object.entries(copy)){
  assert.equal(change.before,templates.profiles[primary].summary);
  assert.equal(fixedResultIntro({primary,summary:change.before}),change.after);
  assert.equal(fixedResultIntro({primary,summary:change.after}),change.after);
  assert.equal(fixedResultIntro({primary,summary:'Managed wording for this report.'}),'Managed wording for this report.');
 }
 assert.equal(fixedResultIntro({primary:null,summary:'Historical result.'}),'Historical result.');
});
test('intro migration is atomic, idempotent and preserves paid chapters, reports and managed edits',()=>{
 const sql=readFileSync('db/releases/2026-10-08-attachment-direct-intros.sql','utf8');
 for(const custom of [false,true]){
  const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE quiz_report_templates(version TEXT PRIMARY KEY,revision INT,content_json TEXT,updated_at TEXT); CREATE TABLE quiz_reports(snapshot_json TEXT);');
  const original=structuredClone(templates);original.revision=4;if(custom)original.profiles.secure.summary='An independently edited summary.';
  db.prepare('INSERT INTO quiz_report_templates(version,revision,content_json) VALUES(?,?,?)').run(original.version,original.revision,JSON.stringify(original));
  db.prepare('INSERT INTO quiz_reports VALUES(?)').run(JSON.stringify(original));db.exec(sql);
  const row=db.prepare('SELECT * FROM quiz_report_templates').get(),next=JSON.parse(row.content_json);
  if(custom)assert.deepEqual(next,original);else{
   assert.equal(row.revision,5);assert.equal(next.revision,5);
   for(const [key,change] of Object.entries(copy)){assert.equal(next.profiles[key].summary,change.after);assert.deepEqual({...next.profiles[key],summary:original.profiles[key].summary},original.profiles[key]);}
  }
  assert.equal(db.prepare('SELECT snapshot_json FROM quiz_reports').get().snapshot_json,JSON.stringify(original));
  db.exec(sql);assert.deepEqual(db.prepare('SELECT * FROM quiz_report_templates').get(),row);db.close();
 }
});
