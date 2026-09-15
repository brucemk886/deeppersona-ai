CREATE TABLE IF NOT EXISTS `deep_orders` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `deep_orders_report_id_unique` ON `deep_orders` (`report_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `deep_orders_stripe_session_id_unique` ON `deep_orders` (`stripe_session_id`);
CREATE INDEX IF NOT EXISTS `deep_orders_intent_idx` ON `deep_orders` (`payment_intent_id`);
