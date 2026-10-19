CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`before_json` text,
	`after_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`root_person_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`root_person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `field_visibility` (
	`field` text NOT NULL,
	`audience` text NOT NULL,
	`subject` text NOT NULL,
	`visible` integer NOT NULL,
	PRIMARY KEY(`field`, `audience`, `subject`)
);
--> statement-breakpoint
CREATE TABLE `parent_child` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`union_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`kind` text DEFAULT 'biological' NOT NULL,
	`birth_order` integer,
	FOREIGN KEY (`union_id`) REFERENCES `unions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parent_child_union_child` ON `parent_child` (`union_id`,`child_id`);--> statement-breakpoint
CREATE TABLE `persons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`other_names` text,
	`gender` text DEFAULT 'unknown' NOT NULL,
	`is_living` integer DEFAULT true NOT NULL,
	`birth_year` integer,
	`birth_month` integer,
	`birth_day` integer,
	`birth_lunar` integer DEFAULT false NOT NULL,
	`birth_place` text,
	`death_year` integer,
	`death_month` integer,
	`death_day` integer,
	`death_lunar` integer DEFAULT false NOT NULL,
	`notes` text,
	`contact` text,
	`photo` text,
	`hide_public` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `unions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`partner1_id` integer NOT NULL,
	`partner2_id` integer,
	`order_index` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'married' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`partner1_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partner2_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_branches` (
	`user_id` integer NOT NULL,
	`branch_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `branch_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);