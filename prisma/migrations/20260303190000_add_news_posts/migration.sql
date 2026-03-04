-- CreateTable
CREATE TABLE `news_posts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `audience` ENUM('ALL', 'MANAGERS', 'EMPLOYEES') NOT NULL DEFAULT 'ALL',
  `module` ENUM('TRAINING', 'POLICY', 'MANAGEMENT', 'FORMS') NULL,
  `section` ENUM(
    'RECIPE_TRAINING',
    'RECIPE',
    'MISE_EN_PLACE_SOP',
    'RED_RULES',
    'BLACK_RULES',
    'SALLE_TOOLS',
    'CUISINE_TOOLS',
    'MEAT_DATE_FORM',
    'CLEANING_FORM'
  ) NULL,
  `attachment_document_id` INTEGER NULL,
  `created_by_user_id` INTEGER NOT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  INDEX `news_posts_created_at_idx`(`created_at`),
  INDEX `news_posts_audience_created_at_idx`(`audience`, `created_at`),
  INDEX `news_posts_module_section_created_at_idx`(`module`, `section`, `created_at`),
  INDEX `news_posts_attachment_document_id_idx`(`attachment_document_id`),
  INDEX `news_posts_created_by_user_id_idx`(`created_by_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news_post_reads` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `news_post_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `read_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `news_post_reads_news_post_id_user_id_key`(`news_post_id`, `user_id`),
  INDEX `news_post_reads_user_id_read_at_idx`(`user_id`, `read_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `news_posts`
  ADD CONSTRAINT `news_posts_attachment_document_id_fkey`
  FOREIGN KEY (`attachment_document_id`) REFERENCES `Document`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news_posts`
  ADD CONSTRAINT `news_posts_created_by_user_id_fkey`
  FOREIGN KEY (`created_by_user_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news_post_reads`
  ADD CONSTRAINT `news_post_reads_news_post_id_fkey`
  FOREIGN KEY (`news_post_id`) REFERENCES `news_posts`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news_post_reads`
  ADD CONSTRAINT `news_post_reads_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
