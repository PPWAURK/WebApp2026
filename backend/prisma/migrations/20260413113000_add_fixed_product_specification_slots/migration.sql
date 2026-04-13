ALTER TABLE `produits`
    ADD COLUMN `specification_2` VARCHAR(100) NULL,
    ADD COLUMN `specification_3` VARCHAR(100) NULL,
    ADD COLUMN `unit_2` VARCHAR(100) NULL,
    ADD COLUMN `unit_3` VARCHAR(100) NULL,
    ADD COLUMN `prix_u_ht_2` DECIMAL(10, 2) NULL,
    ADD COLUMN `prix_u_ht_3` DECIMAL(10, 2) NULL;

ALTER TABLE `purchase_order_items`
    ADD COLUMN `specification_slot` INTEGER NULL,
    ADD COLUMN `specification` VARCHAR(100) NULL;

ALTER TABLE `purchase_return_items`
    ADD COLUMN `specification_slot` INTEGER NULL,
    ADD COLUMN `specification` VARCHAR(100) NULL;
