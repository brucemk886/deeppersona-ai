import { ensureQuizSchema, getD1 } from './quiz-store';

let schemaReady: Promise<void> | undefined;
export function ensureTrafficSchema(): Promise<void> {
  if (!schemaReady) schemaReady = createTrafficSchema().catch(error => { schemaReady = undefined; throw error; });
  return schemaReady;
}
async function createTrafficSchema() {
  await ensureQuizSchema();
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS traffic_anonymous_pages (id TEXT PRIMARY KEY, page TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS traffic_anonymous_date ON traffic_anonymous_pages(created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_attribution (session_id TEXT PRIMARY KEY, visit_id TEXT, source TEXT NOT NULL, campaign TEXT NOT NULL, medium TEXT NOT NULL, content TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_test_sessions (session_id TEXT PRIMARY KEY, marked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS quiz_attribution_visit ON quiz_attribution(visit_id)`),
  ]);
}

export async function recordAttribution(sessionId: string, input: { visitId?: string; source?: string; campaign?: string; medium?: string; content?: string }) {
  await ensureTrafficSchema();
  await getD1().prepare(`INSERT OR IGNORE INTO quiz_attribution (session_id, visit_id, source, campaign, medium, content) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(sessionId, input.visitId ?? null, input.source ?? 'unknown', input.campaign ?? '', input.medium ?? '', input.content ?? '').run();
}
