import { env } from "cloudflare:workers";
import {
  defaultQuestions,
  defaultTests,
  TRAIT_KEYS,
  type QuizOption,
  type AffiliateProduct,
  type QuizQuestion,
  type QuizTest,
  type ResultProfile,
  type TraitKey,
} from "@/lib/quiz";
import { getOptionInsight } from "@/lib/choice-insights";
import { INNER_DIMENSIONS, TEST_DIMENSIONS, type InnerDimensionId, type InnerProfileSummary } from "@/lib/inner-map";
import {
  isRelationshipType,
  type RelationshipNode,
  type RelationshipType,
} from "@/lib/relationship-network";

type RuntimeEnv = {
  ADMIN_EMAILS?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  ADMIN_USERNAME?: string;
  CONTENT_SYNC_API_KEY?: string;
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
  report_price_cents: number;
  id: string;
  kicker: string;
  position: number;
  question_count?: number;
  results_json: string;
  title: string;
};

type AffiliateProductRow = {
  id: string;
  name: string;
  description: string;
  url: string;
  button_label: string;
  active: number;
  position: number;
};
type RelationshipRow = {
  id: string;
  nickname: string;
  relationship_type: string;
  reflection_count: number;
  dimensions: string | null;
  last_reflection_at: string | null;
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
    db.prepare(`CREATE TABLE IF NOT EXISTS affiliate_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      url TEXT NOT NULL,
      button_label TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_tests (
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
      report_price_cents INTEGER NOT NULL DEFAULT 499,
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
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_profiles (
      id TEXT PRIMARY KEY,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS relationship_nodes (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS relationship_reflections (
      id TEXT PRIMARY KEY,
      relationship_id TEXT NOT NULL,
      session_id TEXT,
      test_id TEXT NOT NULL,
      dimension_id TEXT NOT NULL,
      result_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS quiz_sessions (
      id TEXT PRIMARY KEY,
      profile_id TEXT,
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

  await db.prepare("ALTER TABLE quiz_tests ADD COLUMN report_price_cents INTEGER NOT NULL DEFAULT 499").run().catch((error: unknown) => {
    if (!(error instanceof Error) || !/duplicate column name/i.test(error.message)) throw error;
  });
  await db.prepare("ALTER TABLE quiz_sessions ADD COLUMN profile_id TEXT").run().catch((error: unknown) => {
    if (!(error instanceof Error) || !/duplicate column name/i.test(error.message)) throw error;
  });

  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS affiliate_products_active_idx ON affiliate_products(active, position)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_questions_test_idx ON quiz_questions(test_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_session_idx ON quiz_events(session_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_name_idx ON quiz_events(event_name)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_question_idx ON quiz_events(question_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_events_test_idx ON quiz_events(test_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_profiles_email_idx ON quiz_profiles(email)"),
    db.prepare("CREATE INDEX IF NOT EXISTS relationship_nodes_profile_idx ON relationship_nodes(profile_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS relationship_reflections_relationship_idx ON relationship_reflections(relationship_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS relationship_reflections_session_idx ON relationship_reflections(session_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_sessions_profile_idx ON quiz_sessions(profile_id)"),
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
    reportPriceCents: Number(row.report_price_cents ?? 499),
    questionCount: Number(row.question_count ?? 0),
  };
}


function rowToAffiliateProduct(row: AffiliateProductRow): AffiliateProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    buttonLabel: row.button_label,
    active: Boolean(row.active),
    position: Number(row.position),
  };
}

export async function listAffiliateProducts(includeInactive = false): Promise<AffiliateProduct[]> {
  await ensureQuizSchema();
  const where = includeInactive ? "" : "WHERE active = 1";
  const result = await getD1().prepare(`SELECT * FROM affiliate_products ${where} ORDER BY position, id`).all<AffiliateProductRow>();
  return result.results.map(rowToAffiliateProduct);
}

export async function saveAffiliateProduct(product: AffiliateProduct): Promise<void> {
  await ensureQuizSchema();
  await getD1().prepare(`INSERT INTO affiliate_products
    (id, name, description, url, button_label, active, position, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      url = excluded.url,
      button_label = excluded.button_label,
      active = excluded.active,
      position = excluded.position,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(product.id, product.name, product.description, product.url, product.buttonLabel, product.active ? 1 : 0, product.position)
    .run();
}

export async function deleteAffiliateProduct(id: string): Promise<void> {
  await ensureQuizSchema();
  await getD1().prepare("DELETE FROM affiliate_products WHERE id = ?").bind(id).run();
}
async function seedCatalogIfNeeded(): Promise<void> {
  const db = getD1();
  const count = await db.prepare("SELECT COUNT(*) AS total FROM quiz_tests").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;

  await db.batch([
    ...defaultTests.map((test) =>
      db.prepare(`INSERT OR IGNORE INTO quiz_tests
        (id, title, kicker, description, cover_atlas_path, accent, results_json, position, active, featured, report_price_cents)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(test.id, test.title, test.kicker, test.description, test.coverAtlasPath, test.accent, JSON.stringify(test.results), test.position, test.active ? 1 : 0, test.featured ? 1 : 0, test.reportPriceCents),
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
    (id, title, kicker, description, cover_atlas_path, accent, results_json, position, active, featured, report_price_cents, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      report_price_cents = excluded.report_price_cents,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(test.id, test.title, test.kicker, test.description, test.coverAtlasPath, test.accent, JSON.stringify(test.results), test.position, test.active ? 1 : 0, test.featured ? 1 : 0, test.reportPriceCents)
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
  const result = await getD1().prepare(`SELECT q.* FROM quiz_questions q
    LEFT JOIN quiz_tests t ON t.id = q.test_id
    ${where ? where.replaceAll("active", "q.active") : ""}
    ORDER BY COALESCE(t.position, 2147483647), q.test_id, q.position, q.id`).bind(...values).all<QuestionRow>();
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

function rowToRelationship(row: RelationshipRow): RelationshipNode {
  const validDimensionIds = new Set(INNER_DIMENSIONS.map((dimension) => dimension.id));
  const exploredDimensionIds = (row.dimensions ?? "")
    .split(",")
    .filter((dimension): dimension is InnerDimensionId => validDimensionIds.has(dimension as InnerDimensionId));
  return {
    id: row.id,
    nickname: row.nickname,
    relationshipType: isRelationshipType(row.relationship_type) ? row.relationship_type : "other",
    reflectionCount: Number(row.reflection_count ?? 0),
    exploredDimensionIds,
    ...(row.last_reflection_at ? { lastReflectionAt: row.last_reflection_at } : {}),
  };
}

export async function listRelationships(profileId: string): Promise<RelationshipNode[]> {
  await ensureQuizSchema();
  const result = await getD1().prepare(`SELECT n.id, n.nickname, n.relationship_type,
      COUNT(r.id) AS reflection_count,
      GROUP_CONCAT(DISTINCT r.dimension_id) AS dimensions,
      MAX(r.created_at) AS last_reflection_at
    FROM relationship_nodes n
    LEFT JOIN relationship_reflections r ON r.relationship_id = n.id
    WHERE n.profile_id = ?
    GROUP BY n.id, n.nickname, n.relationship_type
    ORDER BY COALESCE(MAX(r.created_at), n.updated_at) DESC, n.created_at DESC`)
    .bind(profileId)
    .all<RelationshipRow>();
  return result.results.map(rowToRelationship);
}

export async function createRelationship(input: {
  profileId: string;
  nickname: string;
  relationshipType: RelationshipType;
}): Promise<RelationshipNode> {
  await ensureQuizSchema();
  const id = crypto.randomUUID();
  await getD1().prepare(`INSERT INTO relationship_nodes
    (id, profile_id, nickname, relationship_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
    .bind(id, input.profileId, input.nickname, input.relationshipType)
    .run();
  return {
    id,
    nickname: input.nickname,
    relationshipType: input.relationshipType,
    reflectionCount: 0,
    exploredDimensionIds: [],
  };
}
export async function getProfileSummary(profileId: string): Promise<InnerProfileSummary> {
  await ensureQuizSchema();
  const db = getD1();
  const [profile, completed] = await Promise.all([
    db.prepare("SELECT email FROM quiz_profiles WHERE id = ?").bind(profileId).first<{ email: string | null }>(),
    db.prepare(`SELECT DISTINCT test_id FROM quiz_sessions
      WHERE profile_id = ? AND completed_at IS NOT NULL AND test_id IS NOT NULL
      ORDER BY completed_at`)
      .bind(profileId)
      .all<{ test_id: string }>(),
  ]);
  return {
    completedTestIds: completed.results.map((item) => item.test_id),
    ...(profile?.email ? { email: profile.email } : {}),
  };
}

export async function submitQuiz(input: {
  answers: Record<string, TraitKey>;
  campaign?: string;
  email: string;
  marketingConsent: boolean;
  profileId: string;
  relationshipId?: string;
  resultType: TraitKey;
  sessionId: string;
  source?: string;
  testId: string;
}): Promise<InnerProfileSummary> {
  await ensureQuizSchema();
  const db = getD1();
  const relationshipDimension = input.relationshipId ? TEST_DIMENSIONS[input.testId] : undefined;
  if (input.relationshipId) {
    const relationship = await db.prepare("SELECT id FROM relationship_nodes WHERE id = ? AND profile_id = ?")
      .bind(input.relationshipId, input.profileId)
      .first<{ id: string }>();
    if (!relationship) throw new Error("That relationship is not available in this profile.");
  }

  const writes = [
    db.prepare(`INSERT INTO quiz_profiles (id, email, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET email = excluded.email, updated_at = CURRENT_TIMESTAMP`)
      .bind(input.profileId, input.email),
    db.prepare(`INSERT INTO quiz_sessions
      (id, profile_id, test_id, email, marketing_consent, answers_json, result_type, source, campaign, current_step, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        profile_id = excluded.profile_id,
        test_id = excluded.test_id,
        email = excluded.email,
        marketing_consent = excluded.marketing_consent,
        answers_json = excluded.answers_json,
        result_type = excluded.result_type,
        source = COALESCE(quiz_sessions.source, excluded.source),
        campaign = COALESCE(quiz_sessions.campaign, excluded.campaign),
        current_step = excluded.current_step,
        completed_at = CURRENT_TIMESTAMP`)
      .bind(input.sessionId, input.profileId, input.testId, input.email, input.marketingConsent ? 1 : 0, JSON.stringify(input.answers), input.resultType, input.source ?? null, input.campaign ?? null, Object.keys(input.answers).length + 1),
    db.prepare(`INSERT INTO quiz_events (session_id, event_name, step, source, test_id, created_at)
      VALUES (?, 'email_submitted', ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(input.sessionId, Object.keys(input.answers).length + 1, input.source ?? null, input.testId),
  ];
  if (input.relationshipId && relationshipDimension) {
    writes.push(
      db.prepare(`INSERT INTO relationship_reflections
        (id, relationship_id, session_id, test_id, dimension_id, result_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
        .bind(crypto.randomUUID(), input.relationshipId, input.sessionId, input.testId, relationshipDimension, input.resultType),
      db.prepare("UPDATE relationship_nodes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(input.relationshipId),
    );
  }
  await db.batch(writes);
  return getProfileSummary(input.profileId);
}
export async function getAdminStats() {
  await ensureQuizSchema();
  await seedCatalogIfNeeded();
  const db = getD1();
  const [funnel, sources, emails, answerEvents, totals, online, today, sevenDays, popularQuestions, popularTests] = await Promise.all([
    db.prepare(`SELECT event_name, COUNT(DISTINCT session_id) AS users FROM quiz_events GROUP BY event_name`).all<{ event_name: string; users: number }>(),
    db.prepare(`SELECT COALESCE(source, 'direct') AS source, COUNT(DISTINCT id) AS users FROM quiz_sessions GROUP BY COALESCE(source, 'direct') ORDER BY users DESC LIMIT 8`).all<{ source: string; users: number }>(),
    db.prepare(`SELECT s.id AS session_id, s.email, s.marketing_consent, s.answers_json, s.result_type, s.source, s.campaign, s.completed_at, s.test_id, COALESCE(t.title, s.test_id) AS test_title
      FROM quiz_sessions s LEFT JOIN quiz_tests t ON t.id = s.test_id
      WHERE s.email IS NOT NULL ORDER BY s.completed_at DESC LIMIT 500`).all<{ answers_json: string | null; campaign: string | null; completed_at: string; email: string; marketing_consent: number; result_type: string; session_id: string; source: string | null; test_id: string | null; test_title: string | null }>(),
    db.prepare(`SELECT e.session_id, e.question_id, e.option_label
      FROM quiz_events e
      WHERE e.event_name = 'answer_selected'
        AND e.question_id IS NOT NULL
        AND e.session_id IN (SELECT id FROM quiz_sessions WHERE email IS NOT NULL ORDER BY completed_at DESC LIMIT 500)
      ORDER BY e.id DESC`).all<{ option_label: string | null; question_id: string; session_id: string }>(),
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
    answerEvents: answerEvents.results,
    onlineNow: online?.users ?? 0,
    today: today ?? { sessions: 0, leads: 0 },
    sevenDays: completeSevenDays,
    popularQuestions: popularQuestions.results,
    popularTests: popularTests.results,
    totals: totals ?? { sessions: 0, leads: 0, consented: 0 },
  };
}
