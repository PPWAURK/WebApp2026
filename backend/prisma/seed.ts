import 'dotenv/config';
import { PrismaClient, Role, WorkplaceRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@webapp2026.local' },
    update: {
      name: 'Admin Principal',
      role: Role.ADMIN,
      isOnProbation: false,
      workplaceRole: WorkplaceRole.BOTH,
      passwordHash,
    },
    create: {
      email: 'admin@webapp2026.local',
      name: 'Admin Principal',
      role: Role.ADMIN,
      isOnProbation: false,
      workplaceRole: WorkplaceRole.BOTH,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@webapp2026.local' },
    update: {
      name: 'Manager Salle',
      role: Role.MANAGER,
      isOnProbation: false,
      workplaceRole: WorkplaceRole.SALLE,
      passwordHash,
    },
    create: {
      email: 'manager@webapp2026.local',
      name: 'Manager Salle',
      role: Role.MANAGER,
      isOnProbation: false,
      workplaceRole: WorkplaceRole.SALLE,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'employee@webapp2026.local' },
    update: {
      name: 'Employe Cuisine',
      role: Role.EMPLOYEE,
      isOnProbation: true,
      workplaceRole: WorkplaceRole.CUISINE,
      passwordHash,
    },
    create: {
      email: 'employee@webapp2026.local',
      name: 'Employe Cuisine',
      role: Role.EMPLOYEE,
      isOnProbation: true,
      workplaceRole: WorkplaceRole.CUISINE,
      passwordHash,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
