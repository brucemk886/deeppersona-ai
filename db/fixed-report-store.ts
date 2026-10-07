import { ensureQuizSchema, getD1 } from './quiz-store';
import { FIXED_VERSION, validTemplates, type FixedTemplates } from '@/lib/attachment-fixed';

export async function getFixedTemplates():Promise<FixedTemplates|null> {
 await ensureQuizSchema();
 const row=await getD1().prepare('SELECT content_json FROM quiz_report_templates WHERE version=?').bind(FIXED_VERSION).first<{content_json:string}>();
 if(!row)return null;
 const value:unknown=JSON.parse(row.content_json);
 if(!validTemplates(value))throw new Error('Invalid managed report edition');
 return value;
}
export async function saveFixedTemplates(value:FixedTemplates):Promise<FixedTemplates|null> {
 await ensureQuizSchema();
 const next={...value,revision:value.revision+1};
 const result=await getD1().prepare('UPDATE quiz_report_templates SET content_json=?,revision=?,updated_at=CURRENT_TIMESTAMP WHERE version=? AND revision=?').bind(JSON.stringify(next),next.revision,FIXED_VERSION,value.revision).run();
 return result.meta?.changes===1?next:null;
}