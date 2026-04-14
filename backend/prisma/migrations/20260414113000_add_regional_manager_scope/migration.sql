ALTER TABLE `User`
    MODIFY `role` ENUM('ADMIN', 'REGIONAL_MANAGER', 'MANAGER', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE';

CREATE TABLE `user_managed_restaurants` (
    `user_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_managed_restaurants_restaurant_id_idx`(`restaurant_id`),
    PRIMARY KEY (`user_id`, `restaurant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_managed_restaurants`
    ADD CONSTRAINT `user_managed_restaurants_user_id_fkey`
        FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `user_managed_restaurants_restaurant_id_fkey`
        FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
