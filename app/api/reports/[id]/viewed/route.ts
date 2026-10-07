import { ownedReport, reportOrder } from '@/db/payment-store';
import { getD1 } from '@/db/quiz-store';
import { paymentError, privateJson, requireSameOrigin } from '@/lib/payment-http';
import { readProfileId } from '@/lib/profile-cookie';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const report = await ownedReport((await params).id, readProfileId(request), request);
    const body = await request.json() as { view?: string };
    if (body.view !== 'summary' && body.view !== 'full') return privateJson({ ok: false }, 400);
    const order = await reportOrder(report.id);
    if (body.view === 'full' && !report.free && order?.status !== 'paid') return privateJson({ ok: false }, 403);
    const event = body.view === 'full' ? 'full_report_viewed' : 'result_viewed';
    // One event per session/step, including reloads and payment polling.
    await getD1().prepare(`INSERT INTO quiz_events (session_id,event_name,step,test_id,created_at)
      SELECT ?,?,0,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM quiz_events WHERE session_id=? AND event_name=?)`)
      .bind(report.session_id, event, report.test_id, report.session_id, event).run();
    return privateJson({ ok: true });
  } catch (error) { return paymentError(error); }
}
