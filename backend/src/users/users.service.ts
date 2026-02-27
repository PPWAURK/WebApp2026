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

  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;

  private ensureRoleScope(actor: {
    actorRole: string;
    actorRestaurantId: number | null;
  }) {
    if (actor.actorRole === Role.ADMIN) {
      return;
    }

    if (actor.actorRole !== Role.MANAGER) {
      throw new BadRequestException('Only ADMIN and MANAGER are allowed');
    }

    if (!actor.actorRestaurantId) {
      throw new BadRequestException('Manager must be assigned to a restaurant');
    }
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        role: true,
        isApproved: true,
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

  async listUsersTrainingAccess(
    restaurantId: number | undefined,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const effectiveRestaurantId =
      actor.actorRole === Role.ADMIN ? restaurantId : actor.actorRestaurantId;

    const users = await this.prisma.user.findMany({
      where: {
        ...(actor.actorRole === Role.ADMIN
          ? {
              role: {
                not: Role.ADMIN,
              },
            }
          : { role: Role.EMPLOYEE }),
        ...(effectiveRestaurantId ? { restaurantId: effectiveRestaurantId } : {}),
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
        isApproved: true,
        isOnProbation: true,
        trainingAccess: true,
      },
    });

    return users.map((user) => ({
      ...user,
      trainingAccess: this.normalizeTrainingAccess(user.trainingAccess),
    }));
  }

  async updateTrainingAccess(
    userId: number,
    sections: string[] | undefined,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

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

    if (actor.actorRole === Role.MANAGER && user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Manager can only update EMPLOYEE training access');
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException('Manager can only update users in own restaurant');
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
        isApproved: true,
        isOnProbation: true,
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
    isApproved?: boolean;
  }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
        restaurantId: params.restaurantId,
        role: Role.EMPLOYEE,
        isApproved: params.isApproved ?? true,
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

  async updateManagerRole(
    userId: number,
    params: {
      isManager: boolean;
      restaurantId?: number;
      actorId: number;
    },
  ) {
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
      throw new BadRequestException('Cannot change ADMIN role here');
    }

    if (params.actorId === userId) {
      throw new BadRequestException('Admin cannot edit own role in this endpoint');
    }

    const nextRestaurantId = params.restaurantId ?? user.restaurantId;

    if (params.isManager && !nextRestaurantId) {
      throw new BadRequestException('Manager must be assigned to a restaurant');
    }

    if (nextRestaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: nextRestaurantId },
        select: { id: true },
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: params.isManager ? Role.MANAGER : Role.EMPLOYEE,
        ...(params.restaurantId ? { restaurantId: params.restaurantId } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurantId: true,
        isApproved: true,
        isOnProbation: true,
        trainingAccess: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return {
      ...updatedUser,
      trainingAccess: this.normalizeTrainingAccess(updatedUser.trainingAccess),
    };
  }

  async confirmEmployeeProbation(
    userId: number,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isOnProbation: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Only EMPLOYEE probation can be confirmed');
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException('Manager can only update users in own restaurant');
    }

    if (!user.isOnProbation) {
      return {
        id: user.id,
        isOnProbation: false,
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnProbation: false,
      },
      select: {
        id: true,
        isOnProbation: true,
      },
    });

    return updated;
  }

  async approveEmployeeAccount(
    userId: number,
    actor: {
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isApproved: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Only EMPLOYEE accounts can be approved');
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException('Manager can only approve users in own restaurant');
    }

    if (user.isApproved) {
      return { id: user.id, isApproved: true };
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
      },
      select: {
        id: true,
        isApproved: true,
      },
    });
  }

  async updateOwnProfilePhoto(
    userId: number,
    file: Express.Multer.File,
    req: { protocol: string; get: (name: string) => string | undefined },
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const profilePhoto = this.buildProfilePhotoUrl(req, file.filename);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        role: true,
        isApproved: true,
        isOnProbation: true,
        workplaceRole: true,
        trainingAccess: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return {
      ...updated,
      trainingAccess: this.normalizeTrainingAccess(updated.trainingAccess),
    };
  }

  private buildProfilePhotoUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    fileName: string,
  ) {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/uploads/images/${fileName}`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/images/${fileName}`;
  }
}
