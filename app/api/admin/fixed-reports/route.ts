import { isAdminRequest } from '@/app/admin-auth';
import { getFixedTemplates,saveFixedTemplates } from '@/db/fixed-report-store';
import { validTemplates } from '@/lib/attachment-fixed';
import { paymentError, privateJson,requireSameOrigin } from '@/lib/payment-http';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!await isAdminRequest(request))return privateJson({error:'Unauthorized'},401);
 try{return privateJson({templates:await getFixedTemplates()});}catch(e){return paymentError(e);}
}
export async function PUT(request:Request){
 if(!await isAdminRequest(request))return privateJson({error:'Unauthorized'},401);
 try{
  requireSameOrigin(request);const value=await request.json();
  if(!validTemplates(value))return privateJson({error:'请填写完整的四份报告，检查标题、段落和版本。'},400);
  const saved=await saveFixedTemplates(value);
  return saved?privateJson({templates:saved}):privateJson({error:'报告已被其他编辑更新或尚未发布，请刷新后重试。'},409);
 }catch(e){return paymentError(e);}
}