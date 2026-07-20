import { env } from "cloudflare:workers";
import { defaultQuestions, type QuizQuestion, type TraitKey } from "@/lib/quiz";

type RuntimeEnv = {
  ADMIN_EMAILS?: string;
  DB?: D1Database;
};

type QuestionRow = {
  active: number;
  atlas_path: string;
  id: string;
  kicker: string;
  options_json: string;
  position: number;
  prompt: string;
};

let schemaReady: Promise<void> | undefined;

export function getRuntimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

function getD1(): D1Database {
  const db = getRuntimeEnv().DB;
  if (!db) throw new Error("D1 binding `DB` is unavailable.");
  return db;
}

async function createSchema(): Promise<void> {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      kicker TEXT NOT NULL,
      prompt TEXT NOT NULL,
      atlas_path TEXT NOT NULL,
      options_json TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_sessions (
      id TEXT PRIMARY KEY,
      email TEXT,
      marketing_consent INTEGER NOT NULL DEFAULT 0,
      answers_json TEXT,
      result_type TEXT,
      source TEXT,
      campaign TEXT,
      current_step INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      step INTEGER NOT NULL DEFAULT 0,
      source TEXT,
      question_id TEXT,
      option_label TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_session_idx ON quiz_events(session_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_name_idx ON quiz_events(event_name)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_question_idx ON quiz_events(question_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_sessions_email_idx ON quiz_sessions(email)"),
  ]);
}

export async function ensureQuizSchema(): Promise<void> {
  schemaReady ??= createSchema().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  await schemaReady;
}

function rowToQuestion(row: QuestionRow): QuizQuestion {
  return {
    id: row.id,
    kicker: row.kicker,
    prompt: row.prompt,
    atlasPath: row.atlas_path,
    options: JSON.parse(row.options_json),
    position: row.position,
    active: Boolean(row.active),
  };
}

async function seedQuestionsIfNeeded(): Promise<void> {
  const db = getD1();
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM quiz_questions")
    .first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;

  await db.batch(
    defaultQuestions.map((question) =>
      db
        .prepare(`INSERT INTO quiz_questions
          (id, kicker, prompt, atlas_path, options_json, position, active)
          VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          question.id,
          question.kicker,
          question.prompt,
          question.atlasPath,
          JSON.stringify(question.options),
          question.position,
          question.active ? 1 : 0,
        ),
    ),
  );
}

export async function listQuestions(includeInactive = false): Promise<QuizQuestion[]> {
  await ensureQuizSchema();
  await seedQuestionsIfNeeded();
  const sql = includeInactive
    ? "SELECT * FROM quiz_questions ORDER BY position, id"
    : "SELECT * FROM quiz_questions WHERE active = 1 ORDER BY position, id";
  const result = await getD1().prepare(sql).all<QuestionRow>();
  return result.results.map(rowToQuestion);
}

export async function saveQuestion(question: QuizQuestion): Promise<void> {
  await ensureQuizSchema();
  await getD1()
    .prepare(`INSERT INTO quiz_questions
      (id, kicker, prompt, atlas_path, options_json, position, active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        kicker = excluded.kicker,
        prompt = excluded.prompt,
        atlas_path = excluded.atlas_path,
        options_json = excluded.options_json,
        position = excluded.position,
        active = excluded.active,
        updated_at = CURRENT_TIMESTAMP`)
    .bind(
      question.id,
      question.kicker,
      question.prompt,
      question.atlasPath,
      JSON.stringify(question.options),
      question.position,
      question.active ? 1 : 0,
    )
    .run();
}

export async function deleteQuestion(id: string): Promise<void> {
  await ensureQuizSchema();
  await getD1().prepare("DELETE FROM quiz_questions WHERE id = ?").bind(id).run();
}

export async function recordEvent(input: {
  campaign?: string;
  eventName: string;
  optionLabel?: string;
  questionId?: string;
  sessionId: string;
  source?: string;
  step?: number;
}): Promise<void> {
  await ensureQuizSchema();
  const db = getD1();
  const step = Math.max(0, Math.floor(input.step ?? 0));
  await db.batch([
    db
      .prepare(`INSERT INTO quiz_sessions (id, source, campaign, current_step)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          source = COALESCE(quiz_sessions.source, excluded.source),
          campaign = COALESCE(quiz_sessions.campaign, excluded.campaign),
          current_step = MAX(quiz_sessions.current_step, excluded.current_step)`)
      .bind(input.sessionId, input.source ?? null, input.campaign ?? null, step),
    db
      .prepare(`INSERT INTO quiz_events
        (session_id, event_name, step, source, question_id, option_label)
        VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(
        input.sessionId,
        input.eventName,
        step,
        input.source ?? null,
        input.questionId ?? null,
        input.optionLabel ?? null,
      ),
  ]);
}

export async function submitQuiz(input: {
  answers: Record<string, TraitKey>;
  campaign?: string;
  email: string;
  marketingConsent: boolean;
  resultType: TraitKey;
  sessionId: string;
  source?: string;
}): Promise<void> {
  await ensureQuizSchema();
  const db = getD1();
  await db.batch([
    db
      .prepare(`INSERT INTO quiz_sessions
        (id, email, marketing_consent, answers_json, result_type, source, campaign, current_step, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          email = excluded.email,
          marketing_consent = excluded.marketing_consent,
          answers_json = excluded.answers_json,
          result_type = excluded.result_type,
          source = COALESCE(quiz_sessions.source, excluded.source),
          campaign = COALESCE(quiz_sessions.campaign, excluded.campaign),
          current_step = excluded.current_step,
          completed_at = CURRENT_TIMESTAMP`)
      .bind(
        input.sessionId,
        input.email,
        input.marketingConsent ? 1 : 0,
        JSON.stringify(input.answers),
        input.resultType,
        input.source ?? null,
        input.campaign ?? null,
        Object.keys(input.answers).length + 1,
      ),
    db
      .prepare(`INSERT INTO quiz_events (session_id, event_name, step, source)
        VALUES (?, 'email_submitted', ?, ?)`)
      .bind(input.sessionId, Object.keys(input.answers).length + 1, input.source ?? null),
  ]);
}

export async function getAdminStats() {
  await ensureQuizSchema();
  const db = getD1();
  const [funnel, sources, emails, totals, online, today, sevenDays, popularQuestions] =
    await Promise.all([
    db
      .prepare(`SELECT event_name, COUNT(DISTINCT session_id) AS users
        FROM quiz_events GROUP BY event_name`)
      .all<{ event_name: string; users: number }>(),
    db
      .prepare(`SELECT COALESCE(source, 'direct') AS source, COUNT(DISTINCT session_id) AS users
        FROM quiz_sessions GROUP BY COALESCE(source, 'direct') ORDER BY users DESC LIMIT 8`)
      .all<{ source: string; users: number }>(),
    db
      .prepare(`SELECT email, marketing_consent, result_type, source, completed_at
        FROM quiz_sessions WHERE email IS NOT NULL ORDER BY completed_at DESC LIMIT 200`)
      .all<{
        completed_at: string;
        email: string;
        marketing_consent: number;
        result_type: string;
        source: string | null;
      }>(),
    db
      .prepare(`SELECT
        COUNT(*) AS sessions,
        SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) AS leads,
        SUM(CASE WHEN marketing_consent = 1 THEN 1 ELSE 0 END) AS consented
        FROM quiz_sessions`)
      .first<{ consented: number; leads: number; sessions: number }>(),
    db
      .prepare(`SELECT COUNT(DISTINCT session_id) AS users
        FROM quiz_events WHERE created_at >= datetime('now', '-5 minutes')`)
      .first<{ users: number }>(),
    db
      .prepare(`SELECT
        COUNT(*) AS sessions,
        SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) AS leads
        FROM quiz_sessions WHERE date(started_at) = date('now')`)
      .first<{ leads: number; sessions: number }>(),
    db
      .prepare(`SELECT
        date(started_at) AS day,
        COUNT(*) AS sessions,
        SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) AS leads
        FROM quiz_sessions
        WHERE started_at >= datetime('now', '-6 days', 'start of day')
        GROUP BY date(started_at)
        ORDER BY day`)
      .all<{ day: string; leads: number; sessions: number }>(),
    db
      .prepare(`SELECT
        e.question_id,
        COALESCE(q.prompt, e.question_id) AS prompt,
        COUNT(*) AS answers,
        COUNT(DISTINCT e.session_id) AS users
        FROM quiz_events e
        LEFT JOIN quiz_questions q ON q.id = e.question_id
        WHERE e.event_name = 'answer_selected' AND e.question_id IS NOT NULL
        GROUP BY e.question_id, q.prompt
        ORDER BY answers DESC
        LIMIT 10`)
      .all<{ answers: number; prompt: string; question_id: string; users: number }>(),
  ]);

  const dailyByDate = new Map(sevenDays.results.map((item) => [item.day, item]));
  const completeSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const day = date.toISOString().slice(0, 10);
    return dailyByDate.get(day) ?? { day, sessions: 0, leads: 0 };
  });

  return {
    funnel: funnel.results,
    sources: sources.results,
    emails: emails.results,
    onlineNow: online?.users ?? 0,
    today: today ?? { sessions: 0, leads: 0 },
    sevenDays: completeSevenDays,
    popularQuestions: popularQuestions.results,
    totals: totals ?? { sessions: 0, leads: 0, consented: 0 },
  };
}
