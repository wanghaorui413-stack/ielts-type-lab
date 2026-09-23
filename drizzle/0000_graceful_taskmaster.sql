CREATE TABLE `daily_metrics` (
	`day` text NOT NULL,
	`event` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `event`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`category` text NOT NULL,
	`message` text NOT NULL
);
