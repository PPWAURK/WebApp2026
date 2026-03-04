-- CreateTable
CREATE TABLE `Document` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(191) NOT NULL,
    `category` ENUM('images', 'videos', 'documents') NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `mediaType` ENUM('image', 'video', 'document') NOT NULL,
    `module` ENUM('TRAINING', 'POLICY', 'MANAGEMENT', 'FORMS') NOT NULL,
    `section` ENUM('RECIPE_TRAINING', 'RECIPE', 'MISE_EN_PLACE_SOP', 'RED_RULES', 'BLACK_RULES', 'SALLE_TOOLS', 'CUISINE_TOOLS', 'MEAT_DATE_FORM', 'CLEANING_FORM') NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploadedByUserId` INTEGER NULL,

    UNIQUE INDEX `Document_fileName_key`(`fileName`),
    INDEX `Document_module_section_mediaType_uploadedAt_idx`(`module`, `section`, `mediaType`, `uploadedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_uploadedByUserId_fkey` FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
