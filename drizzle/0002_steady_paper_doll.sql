ALTER TABLE `users` MODIFY COLUMN `role` enum('Admin','Marketing','Viewer') NOT NULL DEFAULT 'Viewer';--> statement-breakpoint
ALTER TABLE `users` ADD `requestedAt` timestamp;