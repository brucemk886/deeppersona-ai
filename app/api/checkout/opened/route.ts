import { getD1 } from '@/db/quiz-store';
import { deepOrder, ownedReport, reportOrder } from '@/db/payment-store';
import { markLemonCheckoutOpened } from '@/lib/lemonsqueezy';
import { paymentError, privateJson, requireSameOrigin } from '@/lib/payment-http';
import { readProfileId } from '@/lib/profile-cookie';

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json() as { reportId?: string; tier?: string };
    if (typeof body.reportId !== 'string') return privateJson({ ok: false }, 400);
    const report = await ownedReport(body.reportId, readProfileId(request), request);
    const order = body.tier === 'deep' ? await deepOrder(report.id) : await reportOrder(report.id);
    if (order) {
      await markLemonCheckoutOpened(order.id);
      if (body.tier !== 'deep') await getD1().prepare(`INSERT INTO quiz_events (session_id,event_name,step,test_id,created_at)
        SELECT ?,'checkout_opened',0,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM quiz_events WHERE session_id=? AND event_name='checkout_opened')`)
        .bind(report.session_id, report.test_id, report.session_id).run();
    }
    return privateJson({ ok: true });
  } catch (error) { return paymentError(error); }
}
