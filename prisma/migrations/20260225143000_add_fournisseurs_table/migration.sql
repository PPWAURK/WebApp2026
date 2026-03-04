-- CreateTable
CREATE TABLE `fournisseurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default supplier to match existing produits.supplier_id = 1
INSERT INTO `fournisseurs` (`id`, `nom`) VALUES (1, 'Super Store');
