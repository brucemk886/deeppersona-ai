import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const quizQuestions = sqliteTable("quiz_questions", {
  id: text("id").primaryKey(),
  testId: text("test_id").notNull().default("legacy-instinctive-style"),
  kicker: text("kicker").notNull(),
  prompt: text("prompt").notNull(),
  atlasPath: text("atlas_path").notNull(),
  optionsJson: text("options_json").notNull(),
  position: integer("position").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const quizTests = sqliteTable("quiz_tests", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  kicker: text("kicker").notNull(),
  description: text("description").notNull(),
  coverAtlasPath: text("cover_atlas_path").notNull(),
  accent: text("accent").notNull().default("#214c3c"),
  resultsJson: text("results_json").notNull(),
  position: integer("position").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  reportPriceCents: integer("report_price_cents").notNull().default(499),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const quizSessions = sqliteTable("quiz_sessions", {
  id: text("id").primaryKey(),
  testId: text("test_id"),
  email: text("email"),
  marketingConsent: integer("marketing_consent", { mode: "boolean" })
    .notNull()
    .default(false),
  answersJson: text("answers_json"),
  resultType: text("result_type"),
  source: text("source"),
  campaign: text("campaign"),
  currentStep: integer("current_step").notNull().default(0),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export const quizEvents = sqliteTable("quiz_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  eventName: text("event_name").notNull(),
  step: integer("step").notNull().default(0),
  source: text("source"),
  questionId: text("question_id"),
  optionLabel: text("option_label"),
  testId: text("test_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
