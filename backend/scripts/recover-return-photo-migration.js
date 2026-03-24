const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const FAILED_MIGRATION_NAME = '20260324173000_add_return_item_photos';

async function markFailedMigrationAsRolledBack() {
  return prisma.$executeRaw`
    UPDATE _prisma_migrations
    SET rolled_back_at = COALESCE(rolled_back_at, NOW())
    WHERE migration_name = ${FAILED_MIGRATION_NAME}
      AND finished_at IS NULL
      AND rolled_back_at IS NULL
  `;
}

async function main() {
  const updatedRows = await markFailedMigrationAsRolledBack();

  if (updatedRows > 0) {
    console.log(
      `Marked ${updatedRows} failed migration record(s) as rolled back for ${FAILED_MIGRATION_NAME}.`,
    );
    return;
  }

  console.log(`No failed migration record found for ${FAILED_MIGRATION_NAME}.`);
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
