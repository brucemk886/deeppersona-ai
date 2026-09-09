import { ensureTrafficSchema } from '@/db/traffic-store';
import { getD1 } from '@/db/quiz-store';
import { privateJson, requireSameOrigin, paymentError } from '@/lib/payment-http';

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (Number(request.headers.get('content-length') || 0) > 4096) return privateJson({ error: 'Too large' }, 413);
    const raw = await request.text();
    if (raw.length > 4096) return privateJson({ error: 'Too large' }, 413);
    const b = JSON.parse(raw);
    const uuid = /^[a-f0-9-]{36}$/i;
    if (b.anonymous === true && typeof b.id === 'string' && uuid.test(b.id) && ['/','/tests','/insights','/other'].includes(b.page)) {
      await ensureTrafficSchema();
      await getD1().prepare('INSERT OR IGNORE INTO traffic_anonymous_pages (id,page) VALUES (?,?)').bind(b.id,b.page).run();
      return privateJson({ok:true});
    }
    return privateJson({error:'Invalid event'},400);
  } catch(error) { return paymentError(error); }
}
