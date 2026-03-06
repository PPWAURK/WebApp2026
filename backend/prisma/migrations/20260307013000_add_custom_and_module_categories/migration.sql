ALTER TABLE `Document`
  ADD COLUMN `custom_category` VARCHAR(80) NULL;

CREATE INDEX `Document_module_section_custom_category_uploadedAt_idx`
  ON `Document`(`module`, `section`, `custom_category`, `uploadedAt`);

CREATE TABLE `module_categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `module` ENUM('TRAINING', 'POLICY', 'MANAGEMENT', 'FORMS') NOT NULL,
  `name` VARCHAR(80) NOT NULL,
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
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `module_categories_module_name_key`(`module`, `name`),
  INDEX `module_categories_module_section_idx`(`module`, `section`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `module_categories` (`module`, `name`, `section`) VALUES
  ('TRAINING', 'RECIPE_TRAINING', 'RECIPE_TRAINING'),
  ('TRAINING', 'RECIPE', 'RECIPE'),
  ('TRAINING', 'MISE_EN_PLACE_SOP', 'MISE_EN_PLACE_SOP'),
  ('POLICY', 'RED_RULES', 'RED_RULES'),
  ('POLICY', 'BLACK_RULES', 'BLACK_RULES'),
  ('MANAGEMENT', 'SALLE_TOOLS', 'SALLE_TOOLS'),
  ('MANAGEMENT', 'CUISINE_TOOLS', 'CUISINE_TOOLS'),
  ('FORMS', 'MEAT_DATE_FORM', 'MEAT_DATE_FORM'),
  ('FORMS', 'CLEANING_FORM', 'CLEANING_FORM');
