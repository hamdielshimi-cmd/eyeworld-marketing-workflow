CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(32) NOT NULL,
	`actorId` int,
	`actorName` varchar(255) NOT NULL,
	`actorEmail` varchar(320) NOT NULL,
	`action` varchar(255) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(32) NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`senderEmail` varchar(320) NOT NULL,
	`assigneeId` int,
	`assigneeName` varchar(255) NOT NULL,
	`assigneeEmail` varchar(320) NOT NULL,
	`requestType` varchar(255) NOT NULL,
	`status` enum('Pending Approval','Approved','On Hold','Revision Required','Clarification Needed','Ready to Publish') NOT NULL DEFAULT 'Pending Approval',
	`mediaLink` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_requests_requestId_unique` UNIQUE(`requestId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','marketing','viewer') NOT NULL DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE `users` ADD `accessStatus` enum('Active','Pending','Inactive') DEFAULT 'Pending' NOT NULL;