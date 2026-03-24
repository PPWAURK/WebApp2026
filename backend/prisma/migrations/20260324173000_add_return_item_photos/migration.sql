ALTER TABLE `Document`
  MODIFY COLUMN `section` ENUM(
    'RECIPE_TRAINING',
    'RECIPE',
    'MISE_EN_PLACE_SOP',
    'RED_RULES',
    'BLACK_RULES',
    'SALLE_TOOLS',
    'CUISINE_TOOLS',
    'ORDER_RETURNS',
    'MEAT_DATE_FORM',
    'CLEANING_FORM'
  ) NOT NULL;

ALTER TABLE `module_categories`
  MODIFY COLUMN `section` ENUM(
    'RECIPE_TRAINING',
    'RECIPE',
    'MISE_EN_PLACE_SOP',
    'RED_RULES',
    'BLACK_RULES',
    'SALLE_TOOLS',
    'CUISINE_TOOLS',
    'ORDER_RETURNS',
    'MEAT_DATE_FORM',
    'CLEANING_FORM'
  ) NOT NULL;

ALTER TABLE `news_posts`
  MODIFY COLUMN `section` ENUM(
    'RECIPE_TRAINING',
    'RECIPE',
    'MISE_EN_PLACE_SOP',
    'RED_RULES',
    'BLACK_RULES',
    'SALLE_TOOLS',
    'CUISINE_TOOLS',
    'ORDER_RETURNS',
    'MEAT_DATE_FORM',
    'CLEANING_FORM'
  ) NULL;

CREATE TABLE `purchase_return_item_photos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `purchase_return_item_id` INT NOT NULL,
  `document_id` INT NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `purchase_return_item_photos_purchase_return_item_id_document_id_key`(`purchase_return_item_id`, `document_id`),
  INDEX `purchase_return_item_photos_document_id_idx`(`document_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_return_item_photos`
  ADD CONSTRAINT `purchase_return_item_photos_purchase_return_item_id_fkey`
  FOREIGN KEY (`purchase_return_item_id`) REFERENCES `purchase_return_items`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `purchase_return_item_photos`
  ADD CONSTRAINT `purchase_return_item_photos_document_id_fkey`
  FOREIGN KEY (`document_id`) REFERENCES `Document`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
