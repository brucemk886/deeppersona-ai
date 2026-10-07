import { isAdminRequest } from '@/app/admin-auth';
import { getFixedTemplates } from '@/db/fixed-report-store';
import { listQuestions } from '@/db/quiz-store';
import { buildFixedReport } from '@/lib/attachment-fixed-report';
import { FIXED_VERSION, validTemplates } from '@/lib/attachment-fixed';
import { paymentError, privateJson, requireSameOrigin } from '@/lib/payment-http';
export async function POST(request:Request){
 if(!await isAdminRequest(request))return privateJson({error:'Unauthorized'},401);
 try{
  requireSameOrigin(request);const body=await request.json() as {templates?:unknown; choices?:Record<string,number>};
  const templates=body.templates ?? await getFixedTemplates();
  const questions=(await listQuestions('attachment-style')).filter(q=>q.reportConfig?.version===FIXED_VERSION);
  const choices=body.choices;
  if(!validTemplates(templates)||questions.length!==20||!choices||Object.keys(choices).length!==questions.length||questions.some(q=>!Number.isInteger(choices[q.id])||!q.options[choices[q.id]]))return privateJson({error:'请为全部 20 题选择答案，并保留完整报告配置。'},400);
  return privateJson({report:buildFixedReport(questions,choices,templates).deepResult.fixedReport});
 }catch(e){return paymentError(e);}
}