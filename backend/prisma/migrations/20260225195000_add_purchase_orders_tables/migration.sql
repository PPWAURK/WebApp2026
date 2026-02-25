-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(50) NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `delivery_date` DATE NOT NULL,
    `delivery_address` VARCHAR(255) NOT NULL,
    `total_items` INTEGER NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `bon_file_name` VARCHAR(191) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE INDEX `purchase_orders_number_key`(`number`),
    INDEX `purchase_orders_restaurant_id_created_at_idx`(`restaurant_id`, `created_at`),
    INDEX `purchase_orders_supplier_id_created_at_idx`(`supplier_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_order_id` INTEGER NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price_ht` DECIMAL(10, 2) NOT NULL,
    `line_total` DECIMAL(10, 2) NOT NULL,
    `name_zh` VARCHAR(255) NOT NULL,
    `name_fr` VARCHAR(255) NULL,
    `unit` VARCHAR(100) NULL,
    `category` VARCHAR(20) NOT NULL,

    INDEX `purchase_order_items_purchase_order_id_idx`(`purchase_order_id`),
    INDEX `purchase_order_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `fournisseurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `produits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
