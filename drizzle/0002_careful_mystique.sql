CREATE TABLE `quiz_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kicker` text NOT NULL,
	`description` text NOT NULL,
	`cover_atlas_path` text NOT NULL,
	`accent` text DEFAULT '#214c3c' NOT NULL,
	`results_json` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `quiz_events` ADD `test_id` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `test_id` text DEFAULT 'legacy-instinctive-style' NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sessions` ADD `test_id` text;