CREATE TABLE `training_quiz_links` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
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
  ) NOT NULL,
  `language` VARCHAR(5) NOT NULL,
  `quiz_url` VARCHAR(2048) NOT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL,
  UNIQUE INDEX `training_quiz_links_section_language_key`(`section`, `language`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
