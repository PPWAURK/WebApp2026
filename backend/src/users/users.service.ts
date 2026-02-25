import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Role, WorkplaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  isUploadSection,
  UPLOAD_SECTION_BY_MODULE,
  type UploadSection,
} from '../uploads/upload-taxonomy';

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
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        role: true,
        isOnProbation: true,
        workplaceRole: true,
        trainingAccess: true,
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

  async listUsersTrainingAccess(restaurantId?: number) {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
        ...(restaurantId ? { restaurantId } : {}),
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        role: true,
        trainingAccess: true,
      },
    });

    return users.map((user) => ({
      ...user,
      trainingAccess: this.normalizeTrainingAccess(user.trainingAccess),
    }));
  }

  async updateTrainingAccess(userId: number, sections: string[] | undefined) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot update ADMIN training access');
    }

    if (!sections) {
      throw new BadRequestException('sections is required');
    }

    const uniqueSections = Array.from(new Set(sections));
    if (!uniqueSections.every((section) => isUploadSection(section))) {
      throw new BadRequestException('Invalid training section');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        trainingAccess: uniqueSections,
      },
      select: {
        id: true,
        email: true,
        name: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        role: true,
        trainingAccess: true,
      },
    });

    return {
      ...updatedUser,
      trainingAccess: this.normalizeTrainingAccess(updatedUser.trainingAccess),
    };
  }

  createEmployee(params: {
    email: string;
    passwordHash: string;
    name?: string;
    restaurantId: number;
  }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
        restaurantId: params.restaurantId,
        role: Role.EMPLOYEE,
        isOnProbation: true,
        workplaceRole: WorkplaceRole.BOTH,
        trainingAccess: this.getAllTrainingSections(),
      },
    });
  }

  normalizeTrainingAccess(value: Prisma.JsonValue | null): UploadSection[] {
    if (!Array.isArray(value)) {
      return this.getAllTrainingSections();
    }

    const valid = value.filter(
      (entry): entry is string => typeof entry === 'string' && isUploadSection(entry),
    );
    return valid as UploadSection[];
  }

  private getAllTrainingSections(): UploadSection[] {
    return Object.values(UPLOAD_SECTION_BY_MODULE).flat();
  }

  listUnassignedEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
        restaurantId: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async assignUserRestaurant(userId: number, restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot assign restaurant to ADMIN via this endpoint');
    }

    if (user.restaurantId) {
      throw new BadRequestException('User is already assigned to a restaurant');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        restaurantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });
  }
}
