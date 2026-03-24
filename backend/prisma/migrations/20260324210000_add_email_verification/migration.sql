ALTER TABLE `User`
ADD COLUMN `email_verified_at` DATETIME(3) NULL;

UPDATE `User`
SET `email_verified_at` = NOW(3)
WHERE `email_verified_at` IS NULL;

CREATE TABLE `email_verification_tokens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `consumed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `email_verification_tokens_token_hash_key`(`token_hash`),
  INDEX `email_verification_tokens_user_id_expires_at_idx`(`user_id`, `expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `email_verification_tokens`
ADD CONSTRAINT `email_verification_tokens_user_id_fkey`
FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
