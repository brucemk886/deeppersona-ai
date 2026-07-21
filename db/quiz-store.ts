import { env } from "cloudflare:workers";
import {
  defaultQuestions,
  defaultTests,
  TRAIT_KEYS,
  type QuizOption,
  type QuizQuestion,
  type QuizTest,
  type ResultProfile,
  type TraitKey,
} from "@/lib/quiz";
import { getOptionInsight } from "@/lib/choice-insights";

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
  test_id: string;
};

type TestRow = {
  accent: string;
  active: number;
  cover_atlas_path: string;
  description: string;
  featured: number;
  id: string;
  kicker: string;
  position: number;
  question_count?: number;
  results_json: string;
  title: string;
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

async function ensureColumn(table: string, column: string, statement: string) {
  const columns = await getD1().prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (!columns.results.some((item) => item.name === column)) {
    await getD1().prepare(statement).run();
  }
}

async function ensureLegacyColumns() {
  const additions = [
    ["quiz_questions", "test_id", "ALTER TABLE quiz_questions ADD COLUMN test_id TEXT NOT NULL DEFAULT 'legacy-instinctive-style'"],
    ["quiz_sessions", "test_id", "ALTER TABLE quiz_sessions ADD COLUMN test_id TEXT"],
    ["quiz_sessions", "email", "ALTER TABLE quiz_sessions ADD COLUMN email TEXT"],
    ["quiz_sessions", "marketing_consent", "ALTER TABLE quiz_sessions ADD COLUMN marketing_consent INTEGER NOT NULL DEFAULT 0"],
    ["quiz_sessions", "answers_json", "ALTER TABLE quiz_sessions ADD COLUMN answers_json TEXT"],
    ["quiz_sessions", "result_type", "ALTER TABLE quiz_sessions ADD COLUMN result_type TEXT"],
    ["quiz_sessions", "source", "ALTER TABLE quiz_sessions ADD COLUMN source TEXT"],
    ["quiz_sessions", "campaign", "ALTER TABLE quiz_sessions ADD COLUMN campaign TEXT"],
    ["quiz_sessions", "current_step", "ALTER TABLE quiz_sessions ADD COLUMN current_step INTEGER NOT NULL DEFAULT 0"],
    ["quiz_sessions", "started_at", "ALTER TABLE quiz_sessions ADD COLUMN started_at TEXT"],
    ["quiz_sessions", "completed_at", "ALTER TABLE quiz_sessions ADD COLUMN completed_at TEXT"],
    ["quiz_events", "session_id", "ALTER TABLE quiz_events ADD COLUMN session_id TEXT"],
    ["quiz_events", "event_name", "ALTER TABLE quiz_events ADD COLUMN event_name TEXT"],
    ["quiz_events", "step", "ALTER TABLE quiz_events ADD COLUMN step INTEGER NOT NULL DEFAULT 0"],
    ["quiz_events", "source", "ALTER TABLE quiz_events ADD COLUMN source TEXT"],
    ["quiz_events", "question_id", "ALTER TABLE quiz_events ADD COLUMN question_id TEXT"],
    ["quiz_events", "option_label", "ALTER TABLE quiz_events ADD COLUMN option_label TEXT"],
    ["quiz_events", "test_id", "ALTER TABLE quiz_events ADD COLUMN test_id TEXT"],
    ["quiz_events", "created_at", "ALTER TABLE quiz_events ADD COLUMN created_at TEXT"],
  ] as const;

  for (const [table, column, statement] of additions) {
    await ensureColumn(table, column, statement);
  }
}

async function createSchema(): Promise<void> {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      kicker TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_atlas_path TEXT NOT NULL,
      accent TEXT NOT NULL DEFAULT '#214c3c',
      results_json TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      featured INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL DEFAULT 'legacy-instinctive-style',
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
      test_id TEXT,
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
      test_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);

  await ensureLegacyColumns();

  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_questions_test_idx ON quiz_questions(test_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_session_idx ON quiz_events(session_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_name_idx ON quiz_events(event_name)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_question_idx ON quiz_events(question_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_test_idx ON quiz_events(test_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_sessions_email_idx ON quiz_sessions(email)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_sessions_test_idx ON quiz_sessions(test_id)"),
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
  const legacyPaths = ["/quiz/doors.png", "/quiz/rooms.png", "/quiz/landscapes.png", "/quiz/symbols.png"];
  const catalogQuestion = defaultQuestions.find((question) => question.id === row.id);
  const legacyPath = legacyPaths[Math.max(0, row.position - 1) % legacyPaths.length];
  const atlasPath = catalogQuestion && row.atlas_path === legacyPath
    ? catalogQuestion.atlasPath
    : row.atlas_path;
  const parsedOptions = JSON.parse(row.options_json) as Partial<QuizOption>[];

  return {
    id: row.id,
    testId: row.test_id,
    kicker: row.kicker,
    prompt: row.prompt,
    atlasPath,
    options: parsedOptions.map((option, index) => {
      const scoreKey = option.scoreKey ?? TRAIT_KEYS[index] ?? "explorer";
      const insight = getOptionInsight(row.test_id, atlasPath, scoreKey);
      return {
        label: option.label ?? `Choice ${String.fromCharCode(65 + index)}`,
        microcopy: option.microcopy ?? "Trust your first response",
        scoreKey,
        meaning: option.meaning?.trim() || insight.meaning,
        projection: option.projection?.trim() || insight.projection,
      };
    }),
    position: row.position,
    active: Boolean(row.active),
  };
}

function rowToTest(row: TestRow): QuizTest {
  return {
    id: row.id,
    title: row.title,
    kicker: row.kicker,
    description: row.description,
    coverAtlasPath: row.cover_atlas_path,
    accent: row.accent,
    results: JSON.parse(row.results_json) as Record<TraitKey, ResultProfile>,
    position: row.position,
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    questionCount: Number(row.question_count ?? 0),
  };
}

async function seedCatalogIfNeeded(): Promise<void> {
  const db = getD1();
  const count = await db.prepare("SELECT COUNT(*) AS total FROM quiz_tests").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;

  await db.batch([
    ...defaultTests.map((test) =>
      db.prepare(`INSERT OR IGNORE INTO quiz_tests
        (id, title, kicker, description, cover_atlas_path, accent, results_json, position, active, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(test.id, test.title, test.kicker, test.description, test.coverAtlasPath, test.accent, JSON.stringify(test.results), test.position, test.active ? 1 : 0, test.featured ? 1 : 0),
    ),
    ...defaultQuestions.map((question) =>
      db.prepare(`INSERT OR IGNORE INTO quiz_questions
        (id, test_id, kicker, prompt, atlas_path, options_json, position, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(question.id, question.testId, question.kicker, question.prompt, question.atlasPath, JSON.stringify(question.options), question.position, question.active ? 1 : 0),
    ),
  ]);
}

export async function listTests(includeInactive = false): Promise<QuizTest[]> {
  await ensureQuizSchema();
  await seedCatalogIfNeeded();
  const where = includeInactive ? "" : "WHERE t.active = 1";
  const result = await getD1().prepare(`SELECT t.*,
      COUNT(CASE WHEN q.active = 1 THEN 1 END) AS question_count
    FROM quiz_tests t
    LEFT JOIN quiz_questions q ON q.test_id = t.id
    ${where}
    GROUP BY t.id
    ORDER BY t.position, t.id`).all<TestRow>();
  return result.results.map(rowToTest);
}

export async function saveTest(test: QuizTest): Promise<void> {
  await ensureQuizSchema();
  await getD1().prepare(`INSERT INTO quiz_tests
    (id, title, kicker, description, cover_atlas_path, accent, results_json, position, active, featured, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      kicker = excluded.kicker,
      description = excluded.description,
      cover_atlas_path = excluded.cover_atlas_path,
      accent = excluded.accent,
      results_json = excluded.results_json,
      position = excluded.position,
      active = excluded.active,
      featured = excluded.featured,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(test.id, test.title, test.kicker, test.description, test.coverAtlasPath, test.accent, JSON.stringify(test.results), test.position, test.active ? 1 : 0, test.featured ? 1 : 0)
    .run();
}

export async function listQuestions(testId?: string, includeInactive = false): Promise<QuizQuestion[]> {
  await ensureQuizSchema();
  await seedCatalogIfNeeded();
  const filters: string[] = [];
  const values: string[] = [];
  if (!includeInactive) filters.push("active = 1");
  if (testId) {
    filters.push("test_id = ?");
    values.push(testId);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await getD1().prepare(`SELECT * FROM quiz_questions ${where} ORDER BY test_id, position, id`).bind(...values).all<QuestionRow>();
  return result.results.map(rowToQuestion);
}

export async function saveQuestion(question: QuizQuestion): Promise<void> {
  await ensureQuizSchema();
  await getD1().prepare(`INSERT INTO quiz_questions
    (id, test_id, kicker, prompt, atlas_path, options_json, position, active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      test_id = excluded.test_id,
      kicker = excluded.kicker,
      prompt = excluded.prompt,
      atlas_path = excluded.atlas_path,
      options_json = excluded.options_json,
      position = excluded.position,
      active = excluded.active,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(question.id, question.testId, question.kicker, question.prompt, question.atlasPath, JSON.stringify(question.options), question.position, question.active ? 1 : 0)
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
  testId?: string;
}): Promise<void> {
  await ensureQuizSchema();
  const db = getD1();
  const step = Math.max(0, Math.floor(input.step ?? 0));
  await db.batch([
    db.prepare(`INSERT INTO quiz_sessions (id, test_id, source, campaign, current_step, started_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        test_id = COALESCE(excluded.test_id, quiz_sessions.test_id),
        source = COALESCE(quiz_sessions.source, excluded.source),
        campaign = COALESCE(quiz_sessions.campaign, excluded.campaign),
        current_step = MAX(quiz_sessions.current_step, excluded.current_step)`)
      .bind(input.sessionId, input.testId ?? null, input.source ?? null, input.campaign ?? null, step),
    db.prepare(`INSERT INTO quiz_events
      (session_id, event_name, step, source, question_id, option_label, test_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(input.sessionId, input.eventName, step, input.source ?? null, input.questionId ?? null, input.optionLabel ?? null, input.testId ?? null),
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
  testId: string;
}): Promise<void> {
  await ensureQuizSchema();
  const db = getD1();
  await db.batch([
    db.prepare(`INSERT INTO quiz_sessions
      (id, test_id, email, marketing_consent, answers_json, result_type, source, campaign, current_step, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        test_id = excluded.test_id,
        email = excluded.email,
        marketing_consent = excluded.marketing_consent,
        answers_json = excluded.answers_json,
        result_type = excluded.result_type,
        source = COALESCE(quiz_sessions.source, excluded.source),
        campaign = COALESCE(quiz_sessions.campaign, excluded.campaign),
        current_step = excluded.current_step,
        completed_at = CURRENT_TIMESTAMP`)
      .bind(input.sessionId, input.testId, input.email, input.marketingConsent ? 1 : 0, JSON.stringify(input.answers), input.resultType, input.source ?? null, input.campaign ?? null, Object.keys(input.answers).length + 1),
    db.prepare(`INSERT INTO quiz_events (session_id, event_name, step, source, test_id, created_at)
      VALUES (?, 'email_submitted', ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(input.sessionId, Object.keys(input.answers).length + 1, input.source ?? null, input.testId),
  ]);
}

export async function getAdminStats() {
  await ensureQuizSchema();
  await seedCatalogIfNeeded();
  const db = getD1();
  const [funnel, sources, emails, totals, online, today, sevenDays, popularQuestions, popularTests] = await Promise.all([
    db.prepare(`SELECT event_name, COUNT(DISTINCT session_id) AS users FROM quiz_events GROUP BY event_name`).all<{ event_name: string; users: number }>(),
    db.prepare(`SELECT COALESCE(source, 'direct') AS source, COUNT(DISTINCT id) AS users FROM quiz_sessions GROUP BY COALESCE(source, 'direct') ORDER BY users DESC LIMIT 8`).all<{ source: string; users: number }>(),
    db.prepare(`SELECT s.email, s.marketing_consent, s.result_type, s.source, s.completed_at, s.test_id, COALESCE(t.title, s.test_id) AS test_title
      FROM quiz_sessions s LEFT JOIN quiz_tests t ON t.id = s.test_id
      WHERE s.email IS NOT NULL ORDER BY s.completed_at DESC LIMIT 500`).all<{ completed_at: string; email: string; marketing_consent: number; result_type: string; source: string | null; test_id: string | null; test_title: string | null }>(),
    db.prepare(`SELECT COUNT(*) AS sessions, SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) AS leads, SUM(CASE WHEN marketing_consent = 1 THEN 1 ELSE 0 END) AS consented FROM quiz_sessions`).first<{ consented: number; leads: number; sessions: number }>(),
    db.prepare(`SELECT COUNT(DISTINCT session_id) AS users FROM quiz_events WHERE created_at >= datetime('now', '-5 minutes')`).first<{ users: number }>(),
    db.prepare(`SELECT COUNT(*) AS sessions, SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) AS leads FROM quiz_sessions WHERE date(started_at) = date('now')`).first<{ leads: number; sessions: number }>(),
    db.prepare(`SELECT date(started_at) AS day, COUNT(*) AS sessions, SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) AS leads FROM quiz_sessions WHERE started_at >= datetime('now', '-6 days', 'start of day') GROUP BY date(started_at) ORDER BY day`).all<{ day: string; leads: number; sessions: number }>(),
    db.prepare(`SELECT e.question_id, COALESCE(q.prompt, e.question_id) AS prompt, COUNT(*) AS answers, COUNT(DISTINCT e.session_id) AS users FROM quiz_events e LEFT JOIN quiz_questions q ON q.id = e.question_id WHERE e.event_name = 'answer_selected' AND e.question_id IS NOT NULL GROUP BY e.question_id, q.prompt ORDER BY answers DESC LIMIT 10`).all<{ answers: number; prompt: string; question_id: string; users: number }>(),
    db.prepare(`SELECT e.test_id, COALESCE(t.title, e.test_id) AS title, COUNT(DISTINCT e.session_id) AS users FROM quiz_events e LEFT JOIN quiz_tests t ON t.id = e.test_id WHERE e.event_name = 'quiz_started' AND e.test_id IS NOT NULL GROUP BY e.test_id, t.title ORDER BY users DESC LIMIT 8`).all<{ test_id: string; title: string; users: number }>(),
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
    popularTests: popularTests.results,
    totals: totals ?? { sessions: 0, leads: 0, consented: 0 },
  };
}
