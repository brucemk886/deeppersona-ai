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
    if (order) await markLemonCheckoutOpened(order.id);
    return privateJson({ ok: true });
  } catch (error) { return paymentError(error); }
}
