CREATE TABLE IF NOT EXISTS `payment_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_session_id` text,
	`payment_intent_id` text,
	`attempt` integer DEFAULT 0 NOT NULL,
	`livemode` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`paid_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `payment_orders_report_id_unique` ON `payment_orders` (`report_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `payment_orders_stripe_session_id_unique` ON `payment_orders` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `quiz_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`test_id` text NOT NULL,
	`email` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`free` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `quiz_reports_session_id_unique` ON `quiz_reports` (`session_id`);