import { Injectable } from '@nestjs/common';
import { Role, WorkplaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOnProbation: true,
        workplaceRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  createEmployee(params: {
    email: string;
    passwordHash: string;
    name?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
        role: Role.EMPLOYEE,
        isOnProbation: true,
        workplaceRole: WorkplaceRole.BOTH,
      },
    });
  }
}
