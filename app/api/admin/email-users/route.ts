import { ensureTrafficSchema } from '@/db/traffic-store';
import { isAdminRequest } from '@/app/admin-auth';
import { ensureQuizSchema, getD1 } from '@/db/quiz-store';
import { privateJson } from '@/lib/payment-http';

export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return privateJson({ error: 'Unauthorized' }, 401);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return privateJson({ error: 'Invalid origin' }, 403);
  const body = await request.json().catch(() => null) as { sessionId?: unknown; deleted?: unknown; isTest?: unknown } | null;
  if (!body || typeof body.sessionId !== 'string' || body.sessionId.length > 100 || (typeof body.deleted !== 'boolean' && typeof body.isTest !== 'boolean')) {
    return privateJson({ error: 'Invalid request' }, 400);
  }
  await ensureQuizSchema();
  await ensureTrafficSchema();
  const db = getD1();
  const lead = await db.prepare('SELECT id FROM quiz_sessions WHERE id = ? AND email IS NOT NULL').bind(body.sessionId).first();
  if (!lead) return privateJson({ error: 'Record not found' }, 404);
  if (typeof body.isTest === 'boolean') {
    if (body.isTest) await db.prepare('INSERT OR IGNORE INTO admin_test_sessions (session_id) VALUES (?)').bind(body.sessionId).run();
    else await db.prepare('DELETE FROM admin_test_sessions WHERE session_id=?').bind(body.sessionId).run();
    return privateJson({ok:true});
  }
  if (body.deleted) {
    await db.prepare('INSERT OR IGNORE INTO admin_deleted_leads (session_id) VALUES (?)').bind(body.sessionId).run();
  } else {
    await db.prepare('DELETE FROM admin_deleted_leads WHERE session_id = ?').bind(body.sessionId).run();
  }
  return privateJson({ ok: true });
}
