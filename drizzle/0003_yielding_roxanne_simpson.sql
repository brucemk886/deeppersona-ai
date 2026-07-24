CREATE TABLE `quiz_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `quiz_sessions` ADD `profile_id` text;--> statement-breakpoint
