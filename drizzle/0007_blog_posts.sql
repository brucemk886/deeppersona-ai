CREATE TABLE IF NOT EXISTS blog_catalog_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  seed_defaults INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS blog_posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  read_minutes INTEGER NOT NULL DEFAULT 5,
  primary_test_id TEXT NOT NULL DEFAULT 'attachment-style',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts(active, published_at);
