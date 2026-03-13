ALTER TABLE `fournisseurs`
    ADD COLUMN `sort_order` INTEGER NULL;

SET @supplier_sort_order := 0;

UPDATE `fournisseurs`
SET `sort_order` = (@supplier_sort_order := @supplier_sort_order + 1)
ORDER BY `nom` ASC, `id` ASC;

ALTER TABLE `fournisseurs`
    MODIFY `sort_order` INTEGER NOT NULL;

CREATE INDEX `fournisseurs_sort_order_idx` ON `fournisseurs`(`sort_order`);
