const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const FAILED_MIGRATION_NAME = '20260504120000_add_supplier_product_categories';

async function hasFailedMigrationRecord() {
  const rows = await prisma.$queryRaw`
    SELECT COUNT(*) AS failedCount
    FROM _prisma_migrations
    WHERE migration_name = ${FAILED_MIGRATION_NAME}
      AND finished_at IS NULL
      AND rolled_back_at IS NULL
  `;

  return Number(rows[0]?.failedCount ?? 0) > 0;
}

async function backfillProductCategoryIds() {
  return prisma.$executeRaw`
    UPDATE produits p
    JOIN product_categories pc
      ON pc.supplier_id = p.supplier_id
     AND pc.name_zh = CASE
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'legume|légume|fruit|菜|果' THEN '蔬菜水果'
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'viande|boeuf|poulet|porc|poisson|肉|鸡|牛|鱼|海鲜' THEN '肉类海鲜'
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'surgele|surgelé|frais|fraiche|冷冻|冷藏|冰鲜' THEN '冷冻冷藏'
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'riz|farine|nouille|huile|sec|米|面|油|干货' THEN '干货粮油'
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'sauce|sel|sucre|epice|酱|盐|糖|调料' THEN '调料酱料'
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'boisson|eau|jus|酒|饮料|水' THEN '饮料酒水'
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'barquette|sac|carton|box|盒|袋|包材' THEN '包材耗材'
        WHEN LOWER(CONCAT_WS(' ', p.categorie, p.nom_cn, p.designation_fr)) REGEXP 'hygiene|nettoy|clean|清洁|卫生' THEN '清洁用品'
        ELSE '其他'
      END
    SET p.product_category_id = pc.id
  `;
}

async function normalizeProductCategorySortOrders() {
  return prisma.$executeRaw`
    UPDATE product_categories
    SET sort_order = CASE name_zh
        WHEN '蔬菜水果' THEN 10
        WHEN '调料酱料' THEN 20
        WHEN '肉类海鲜' THEN 30
        WHEN '冷冻冷藏' THEN 40
        WHEN '干货粮油' THEN 50
        WHEN '饮料酒水' THEN 60
        WHEN '包材耗材' THEN 70
        WHEN '清洁用品' THEN 80
        WHEN '其他' THEN 90
        ELSE sort_order
      END,
      name_fr = CASE name_zh
        WHEN '调料酱料' THEN 'Sauces & Spices'
        ELSE name_fr
      END
    WHERE is_preset = true
  `;
}

async function markFailedMigrationAsFinished() {
  return prisma.$executeRaw`
    UPDATE _prisma_migrations
    SET finished_at = COALESCE(finished_at, NOW()),
        logs = CONCAT(COALESCE(logs, ''), '\nRecovered product category backfill without changing produits.categorie.'),
        rolled_back_at = NULL
    WHERE migration_name = ${FAILED_MIGRATION_NAME}
      AND finished_at IS NULL
      AND rolled_back_at IS NULL
  `;
}

async function main() {
  const shouldRecover = await hasFailedMigrationRecord();

  if (!shouldRecover) {
    console.log(
      `No failed migration record found for ${FAILED_MIGRATION_NAME}.`,
    );
    return;
  }

  const updatedProducts = await backfillProductCategoryIds();
  const updatedCategories = await normalizeProductCategorySortOrders();
  const updatedMigrations = await markFailedMigrationAsFinished();

  console.log(
    `Recovered ${FAILED_MIGRATION_NAME}: backfilled ${updatedProducts} products, normalized ${updatedCategories} categories, and marked ${updatedMigrations} migration record(s) as finished.`,
  );
}

main()
  .catch((error) => {
    console.error(
      `Failed to recover migration ${FAILED_MIGRATION_NAME} before deploy.`,
      error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
