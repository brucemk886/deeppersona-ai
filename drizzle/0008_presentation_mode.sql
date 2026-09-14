ALTER TABLE `quiz_tests` ADD `presentation_mode` text DEFAULT 'image' NOT NULL;
CREATE TABLE IF NOT EXISTS quiz_catalog_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
