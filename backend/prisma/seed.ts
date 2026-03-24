import 'dotenv/config';
import { PrismaClient, Role, WorkplaceRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseAdminEmails(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const parsed = value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  const unique = Array.from(new Set(parsed));
  const invalid = unique.find((email) => !EMAIL_REGEX.test(email));

  if (invalid) {
    throw new Error(`Invalid admin email: ${invalid}`);
  }

  return unique;
}

async function main() {
  const now = new Date();
  const adminEmailsFromEnv = parseAdminEmails(process.env.ADMIN_EMAILS);
  const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD?.trim() ?? '';
  const seedDemoUsers = process.env.SEED_DEMO_USERS === 'true';
  const adminEmails =
    adminEmailsFromEnv.length > 0
      ? adminEmailsFromEnv
      : ['admin@webapp2026.local'];

  let adminsCreated = 0;
  let adminsUpdated = 0;

  for (const email of adminEmails) {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: Role.ADMIN,
          isApproved: true,
          emailVerifiedAt: now,
          isOnProbation: false,
          workplaceRole: WorkplaceRole.BOTH,
        },
      });
      adminsUpdated += 1;
      continue;
    }

    if (!adminDefaultPassword) {
      throw new Error(
        `ADMIN_DEFAULT_PASSWORD is required to create admin account: ${email}`,
      );
    }

    const passwordHash = await bcrypt.hash(adminDefaultPassword, 10);
    await prisma.user.create({
      data: {
        email,
        name: null,
        role: Role.ADMIN,
        isApproved: true,
        emailVerifiedAt: now,
        isOnProbation: false,
        workplaceRole: WorkplaceRole.BOTH,
        passwordHash,
      },
    });
    adminsCreated += 1;
  }

  const shouldSeedDemoUsers = adminEmailsFromEnv.length === 0 || seedDemoUsers;

  if (shouldSeedDemoUsers) {
    const demoPassword = await bcrypt.hash('ChangeMe123!', 10);

    await prisma.user.upsert({
      where: { email: 'manager@webapp2026.local' },
      update: {
        name: 'Manager Salle',
        role: Role.MANAGER,
        isApproved: true,
        emailVerifiedAt: now,
        isOnProbation: false,
        workplaceRole: WorkplaceRole.SALLE,
      },
      create: {
        email: 'manager@webapp2026.local',
        name: 'Manager Salle',
        role: Role.MANAGER,
        isApproved: true,
        emailVerifiedAt: now,
        isOnProbation: false,
        workplaceRole: WorkplaceRole.SALLE,
        passwordHash: demoPassword,
      },
    });

    await prisma.user.upsert({
      where: { email: 'employee@webapp2026.local' },
      update: {
        name: 'Employe Cuisine',
        role: Role.EMPLOYEE,
        isApproved: true,
        emailVerifiedAt: now,
        isOnProbation: true,
        workplaceRole: WorkplaceRole.CUISINE,
      },
      create: {
        email: 'employee@webapp2026.local',
        name: 'Employe Cuisine',
        role: Role.EMPLOYEE,
        isApproved: true,
        emailVerifiedAt: now,
        isOnProbation: true,
        workplaceRole: WorkplaceRole.CUISINE,
        passwordHash: demoPassword,
      },
    });
  }

  console.log(
    `Seed summary: adminsCreated=${adminsCreated}, adminsUpdated=${adminsUpdated}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
