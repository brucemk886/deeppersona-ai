CREATE TABLE `relationship_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`nickname` text NOT NULL,
	`relationship_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `relationship_reflections` (
	`id` text PRIMARY KEY NOT NULL,
	`relationship_id` text NOT NULL,
	`session_id` text,
	`test_id` text NOT NULL,
	`dimension_id` text NOT NULL,
	`result_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
