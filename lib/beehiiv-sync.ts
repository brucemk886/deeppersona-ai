import { getD1, getRuntimeEnv } from '@/db/quiz-store';
import { ASTRO_TEST_ID } from '@/lib/astro';

// Copies new astro-quiz emails to beehiiv. The email screen tells users about the free weekly love forecast and unsubscribing.
// Runs from the report-mailer cron, so the quiz never waits on beehiiv and failed syncs retry.
// Owner decision: no backfill. Only quizzes completed after the first run (when the beehiiv keys are set) are sent.

type Row = { id: string; email: string; source: string | null; campaign: string | null; snapshot_json: string | null; attempts: number | null };
type Snapshot = { chart?: { sun?: { name?: string } }; profile?: { type?: string; partner?: { name?: string } }; input?: { answers?: Record<string, unknown> } };

const BATCH = 25;
const MAX_ATTEMPTS = 8;

async function ensureSchema() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS beehiiv_sync (
      session_id TEXT PRIMARY KEY, email TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt INTEGER NOT NULL DEFAULT 0, subscription_id TEXT, last_error TEXT, updated_at INTEGER NOT NULL
    )`),
    db.prepare('CREATE TABLE IF NOT EXISTS beehiiv_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
    // Same format as quiz_sessions.completed_at (CURRENT_TIMESTAMP). Set once, on the first run.
    db.prepare("INSERT OR IGNORE INTO beehiiv_meta (key, value) VALUES ('sync_from', datetime('now'))"),
    db.prepare('CREATE TABLE IF NOT EXISTS admin_test_sessions (session_id TEXT PRIMARY KEY, marked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS admin_deleted_leads (session_id TEXT PRIMARY KEY, deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
  ]);
}

/** Custom fields sent to beehiiv. Create fields with these exact names in beehiiv to use them in segments. */
export function beehiivFields(snapshotJson: string | null) {
  let snap: Snapshot = {};
  try { snap = snapshotJson ? JSON.parse(snapshotJson) as Snapshot : {}; } catch { /* keep empty */ }
  const answers = snap.input?.answers ?? {};
  const fields: Record<string, string> = {
    sun_sign: snap.chart?.sun?.name ?? '',
    love_type: snap.profile?.type ?? '',
    on_mind: typeof answers.someone === 'string' ? answers.someone : '',
    partner_sign: snap.profile?.partner?.name ?? '',
    gender: typeof answers.gender === 'string' ? answers.gender : '',
  };
  return Object.entries(fields).filter(([, value]) => value).map(([name, value]) => ({ name, value }));
}

async function subscribe(apiKey: string, publicationId: string, row: Row, withFields: boolean) {
  const body = {
    email: row.email,
    reactivate_existing: false,
    send_welcome_email: true,
    utm_source: row.source || 'direct',
    utm_medium: 'quiz',
    utm_campaign: row.campaign || ASTRO_TEST_ID,
    referring_site: 'https://deeppersonaai.com/',
    ...(withFields ? { custom_fields: beehiivFields(row.snapshot_json) } : {}),
  };
  return fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(publicationId)}/subscriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
}

export async function syncBeehiiv(now = Date.now()) {
  const env = getRuntimeEnv() as { BEEHIIV_API_KEY?: string; BEEHIIV_PUBLICATION_ID?: string };
  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) return { skipped: true, synced: 0, failed: 0 };
  await ensureSchema();
  const db = getD1();
  // Test sessions, deleted leads and our own addresses are never sent.
  const { results } = await db.prepare(`SELECT s.id, s.email, s.source, s.campaign, r.snapshot_json, b.attempts
    FROM quiz_sessions s
    LEFT JOIN quiz_reports r ON r.session_id = s.id
    LEFT JOIN beehiiv_sync b ON b.session_id = s.id
    WHERE s.test_id = ? AND s.email IS NOT NULL AND s.marketing_consent = 1 AND s.completed_at IS NOT NULL
      AND s.completed_at >= (SELECT value FROM beehiiv_meta WHERE key = 'sync_from')
      AND s.id NOT IN (SELECT session_id FROM admin_test_sessions)
      AND s.id NOT IN (SELECT session_id FROM admin_deleted_leads)
      AND lower(s.email) NOT LIKE '%@deeppersonaai.com'
      AND (b.session_id IS NULL OR (b.status = 'retry' AND b.next_attempt <= ?))
    ORDER BY s.completed_at LIMIT ?`).bind(ASTRO_TEST_ID, now, BATCH).all<Row>();

  let synced = 0, failed = 0;
  for (const row of results ?? []) {
    const attempts = (row.attempts ?? 0) + 1;
    let status = 'synced', error: string | null = null, subscriptionId: string | null = null;
    try {
      let response = await subscribe(env.BEEHIIV_API_KEY, env.BEEHIIV_PUBLICATION_ID, row, true);
      // A custom field missing in beehiiv must not block the email itself.
      if (response.status === 400) response = await subscribe(env.BEEHIIV_API_KEY, env.BEEHIIV_PUBLICATION_ID, row, false);
      const text = await response.text();
      if (response.ok) {
        try { subscriptionId = (JSON.parse(text) as { data?: { id?: string } }).data?.id ?? null; } catch { /* ignore */ }
      } else {
        error = `HTTP ${response.status}: ${text.slice(0, 300)}`;
        // Rate limits and server errors keep retrying; other client errors (bad email, bad key) stop after 3 tries.
        status = attempts >= MAX_ATTEMPTS || (response.status < 500 && response.status !== 429 && attempts >= 3) ? 'failed' : 'retry';
      }
    } catch (err) {
      error = err instanceof Error ? err.message.slice(0, 300) : 'network error';
      status = attempts >= MAX_ATTEMPTS ? 'failed' : 'retry';
    }
    if (status === 'synced') synced++; else failed++;
    const backoff = Math.min(2 ** attempts, 360) * 60000;
    await db.prepare(`INSERT INTO beehiiv_sync (session_id, email, status, attempts, next_attempt, subscription_id, last_error, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET status = excluded.status, attempts = excluded.attempts, next_attempt = excluded.next_attempt,
        subscription_id = COALESCE(excluded.subscription_id, beehiiv_sync.subscription_id), last_error = excluded.last_error, updated_at = excluded.updated_at`)
      .bind(row.id, row.email, status, attempts, now + backoff, subscriptionId, error, now).run();
  }
  return { skipped: false, synced, failed };
}
