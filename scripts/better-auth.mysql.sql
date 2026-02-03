CREATE TABLE IF NOT EXISTS `user` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `emailVerified` boolean NOT NULL,
  `image` text NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `session` (
  `id` varchar(255) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `token` varchar(255) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ipAddress` text NULL,
  `userAgent` text NULL,
  `userId` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token_unique` (`token`),
  KEY `session_userId_idx` (`userId`),
  CONSTRAINT `session_userId_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `account` (
  `id` varchar(255) NOT NULL,
  `accountId` varchar(255) NOT NULL,
  `providerId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `accessToken` text NULL,
  `refreshToken` text NULL,
  `idToken` text NULL,
  `accessTokenExpiresAt` datetime(3) NULL,
  `refreshTokenExpiresAt` datetime(3) NULL,
  `scope` text NULL,
  `password` text NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `account_userId_idx` (`userId`),
  CONSTRAINT `account_userId_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `verification` (
  `id` varchar(255) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `verification_identifier_idx` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
