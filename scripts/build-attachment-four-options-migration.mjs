import {buildSync} from 'esbuild';import {writeFileSync} from 'node:fs';
const bundle=buildSync({stdin:{contents:"export {fixedQuestions} from './lib/attachment-fixed-content';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
const {fixedQuestions:qs}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
const retired=Object.fromEntries(qs.filter(q=>q.reportConfig.kind==='core').map(q=>{const option=structuredClone(q.options[4]);delete option.fixed.reviewZh;return [q.id,option];}));
writeFileSync('lib/attachment-fixed-compat.ts',`import type {QuizQuestion,QuizOption} from './quiz';
import {FIXED_VERSION} from './attachment-fixed';
// Immutable release metadata for users who loaded the five-option page before
// the four-option correction. Never returned in the current public catalog.
const retiredCoreSkips:Record<string,QuizOption>=${JSON.stringify(retired,null,2)};
export function restoreRetiredCoreSkips(questions:QuizQuestion[],choices:Record<string,number>,optionIds?:Record<string,string>):QuizQuestion[]{
 return questions.map(q=>{
  const retired=retiredCoreSkips[q.id];
  if(q.testId!=='attachment-style'||q.reportConfig?.version!==FIXED_VERSION||q.reportConfig.kind!=='core'||q.options.length!==4||choices[q.id]!==4||!retired||optionIds?.[q.id]!==retired.optionId)return q;
  return {...q,options:[...q.options,retired]};
 });
}
`);
const ids=qs.filter(q=>q.reportConfig.kind==='core').map(q=>`'${q.id}'`).join(',');
const scope=`test_id='attachment-style' AND active=1 AND id IN (${ids}) AND json_extract(report_config_json,'$.version')='attachment-fixed-v2' AND json_extract(report_config_json,'$.kind')='core'`;
const safe=`json_array_length(options_json)=4 OR (json_array_length(options_json)=5 AND json_extract(options_json,'$[4].fixed.tag')='skip' AND json_extract(options_json,'$[4].optionId')=json_extract(options_json,'$[4].fixed.id'))`;
const four=[0,1,2,3].map(i=>`json_extract(options_json,'$[${i}].styleKey') IN ('anxious','avoidant','secure','fearful') AND COALESCE(json_extract(options_json,'$[${i}].fixed.tag'),'') NOT IN ('','skip')`).join(' AND ');
const gate=`(SELECT COUNT(*) FROM quiz_questions WHERE ${scope})=14 AND (SELECT COUNT(*) FROM quiz_questions WHERE ${scope} AND (${safe}) AND ${four})=14`;
writeFileSync('db/releases/2026-10-08-attachment-core-four-options.sql',`-- Remove only the retired fifth skip from the fourteen live V2 core questions.
-- Keep canonical indexes 0..3, managed text, background answers, reports and price.
-- A single guarded update prevents partial changes; rerunning is safe.
UPDATE quiz_questions SET options_json=json_remove(options_json,'$[4]'),updated_at=CURRENT_TIMESTAMP WHERE ${scope} AND json_array_length(options_json)=5 AND (${gate});

INSERT OR IGNORE INTO quiz_catalog_migrations(id) SELECT 'attachment-core-four-options-2026-10-08' WHERE (SELECT COUNT(*) FROM quiz_questions WHERE ${scope} AND json_array_length(options_json)=4)=14;
`);
console.log('Prepared four-choice correction for 14 core questions; preserved retired choices for already-loaded pages.');