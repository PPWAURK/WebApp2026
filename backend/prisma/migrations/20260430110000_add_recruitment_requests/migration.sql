CREATE TABLE `recruitment_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `restaurant_id` INTEGER NOT NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `contract_type` ENUM('PART_TIME', 'FULL_TIME') NOT NULL,
    `headcount` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('PENDING', 'PROCESSED') NOT NULL DEFAULT 'PENDING',
    `processed_by_user_id` INTEGER NULL,
    `processed_at` DATETIME(3) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `recruitment_requests_restaurant_id_created_at_idx`(`restaurant_id`, `created_at`),
    INDEX `recruitment_requests_status_created_at_idx`(`status`, `created_at`),
    INDEX `recruitment_requests_created_by_user_id_idx`(`created_by_user_id`),
    INDEX `recruitment_requests_processed_by_user_id_idx`(`processed_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `recruitment_requests`
    ADD CONSTRAINT `recruitment_requests_restaurant_id_fkey`
    FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurant`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `recruitment_requests`
    ADD CONSTRAINT `recruitment_requests_created_by_user_id_fkey`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `recruitment_requests`
    ADD CONSTRAINT `recruitment_requests_processed_by_user_id_fkey`
    FOREIGN KEY (`processed_by_user_id`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
