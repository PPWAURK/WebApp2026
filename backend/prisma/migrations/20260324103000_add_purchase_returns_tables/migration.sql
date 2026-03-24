CREATE TABLE `purchase_returns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_order_id` INTEGER NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `notes` TEXT NULL,
    `total_items` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `purchase_returns_purchase_order_id_idx`(`purchase_order_id`),
    INDEX `purchase_returns_restaurant_id_created_at_idx`(`restaurant_id`, `created_at`),
    INDEX `purchase_returns_supplier_id_created_at_idx`(`supplier_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `purchase_return_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_return_id` INTEGER NOT NULL,
    `purchase_order_item_id` INTEGER NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INTEGER NOT NULL,
    `name_zh` VARCHAR(255) NOT NULL,
    `name_fr` VARCHAR(255) NULL,
    `unit` VARCHAR(100) NULL,
    `category` VARCHAR(20) NOT NULL,

    INDEX `purchase_return_items_purchase_return_id_idx`(`purchase_return_id`),
    INDEX `purchase_return_items_purchase_order_item_id_idx`(`purchase_order_item_id`),
    INDEX `purchase_return_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_returns`
    ADD CONSTRAINT `purchase_returns_purchase_order_id_fkey`
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `purchase_returns`
    ADD CONSTRAINT `purchase_returns_supplier_id_fkey`
    FOREIGN KEY (`supplier_id`) REFERENCES `fournisseurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_returns`
    ADD CONSTRAINT `purchase_returns_restaurant_id_fkey`
    FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_returns`
    ADD CONSTRAINT `purchase_returns_created_by_user_id_fkey`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_return_items`
    ADD CONSTRAINT `purchase_return_items_purchase_return_id_fkey`
    FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `purchase_return_items`
    ADD CONSTRAINT `purchase_return_items_purchase_order_item_id_fkey`
    FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_return_items`
    ADD CONSTRAINT `purchase_return_items_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `produits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
