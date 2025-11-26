CREATE TABLE `dailyPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`paymentDate` date NOT NULL,
	`pixKey` varchar(255),
	`pixQrCode` text,
	`pixTransactionId` varchar(255),
	`status` enum('pending','confirmed','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`dailyAmount` decimal(10,2) NOT NULL,
	`paidAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`remainingAmount` decimal(10,2) NOT NULL,
	`status` enum('active','paid_off','overdue') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`expectedEndDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`pixKey` varchar(255),
	`pixQrCode` text,
	`pixTransactionId` varchar(255),
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_pixTransactionId_unique` UNIQUE(`pixTransactionId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_cpf_unique` UNIQUE(`cpf`);