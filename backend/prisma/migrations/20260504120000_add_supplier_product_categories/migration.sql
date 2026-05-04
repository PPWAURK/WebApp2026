CREATE TABLE `product_categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `supplier_id` INTEGER NOT NULL,
  `name_zh` VARCHAR(50) NOT NULL,
  `name_fr` VARCHAR(80) NOT NULL,
  `sort_order` INTEGER NOT NULL,
  `is_preset` BOOLEAN NOT NULL DEFAULT false,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `product_categories_supplier_id_name_zh_key`(`supplier_id`, `name_zh`),
  INDEX `product_categories_supplier_id_sort_order_idx`(`supplier_id`, `sort_order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `product_categories`
  ADD CONSTRAINT `product_categories_supplier_id_fkey`
  FOREIGN KEY (`supplier_id`) REFERENCES `fournisseurs`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produits`
  ADD COLUMN `product_category_id` INTEGER NULL,
  ADD INDEX `produits_product_category_id_idx`(`product_category_id`);

ALTER TABLE `produits`
  ADD CONSTRAINT `produits_product_category_id_fkey`
  FOREIGN KEY (`product_category_id`) REFERENCES `product_categories`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `product_categories` (`supplier_id`, `name_zh`, `name_fr`, `sort_order`, `is_preset`)
SELECT f.`id`, preset.`name_zh`, preset.`name_fr`, preset.`sort_order`, true
FROM `fournisseurs` f
JOIN (
  SELECT '蔬菜水果' AS `name_zh`, 'Fruits & legumes' AS `name_fr`, 10 AS `sort_order`
  UNION ALL SELECT '肉类海鲜', 'Viandes & poissons', 20
  UNION ALL SELECT '冷冻冷藏', 'Surgeles & frais', 30
  UNION ALL SELECT '干货粮油', 'Epicerie seche', 40
  UNION ALL SELECT '调料酱料', 'Condiments', 50
  UNION ALL SELECT '饮料酒水', 'Boissons', 60
  UNION ALL SELECT '包材耗材', 'Emballages', 70
  UNION ALL SELECT '清洁用品', 'Hygiene', 80
  UNION ALL SELECT '其他', 'Autres', 90
) preset;

UPDATE `produits` p
JOIN `product_categories` pc
  ON pc.`supplier_id` = p.`supplier_id`
 AND pc.`name_zh` = CASE
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'legume|légume|fruit|菜|果' THEN '蔬菜水果'
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'viande|boeuf|poulet|porc|poisson|肉|鸡|牛|鱼|海鲜' THEN '肉类海鲜'
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'surgele|surgelé|frais|fraiche|冷冻|冷藏|冰鲜' THEN '冷冻冷藏'
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'riz|farine|nouille|huile|sec|米|面|油|干货' THEN '干货粮油'
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'sauce|sel|sucre|epice|酱|盐|糖|调料' THEN '调料酱料'
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'boisson|eau|jus|酒|饮料|水' THEN '饮料酒水'
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'barquette|sac|carton|box|盒|袋|包材' THEN '包材耗材'
    WHEN LOWER(CONCAT_WS(' ', p.`categorie`, p.`nom_cn`, p.`designation_fr`)) REGEXP 'hygiene|nettoy|clean|清洁|卫生' THEN '清洁用品'
    ELSE '其他'
  END
SET p.`product_category_id` = pc.`id`;
