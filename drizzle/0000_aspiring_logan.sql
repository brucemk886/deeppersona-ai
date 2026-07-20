CREATE TABLE `quiz_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`event_name` text NOT NULL,
	`step` integer DEFAULT 0 NOT NULL,
	`source` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`kicker` text NOT NULL,
	`prompt` text NOT NULL,
	`atlas_path` text NOT NULL,
	`options_json` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`answers_json` text,
	`result_type` text,
	`source` text,
	`campaign` text,
	`current_step` integer DEFAULT 0 NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text
);
