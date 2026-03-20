import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, Role, WorkplaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ensureAdminOrManagerScope } from './users-scope';
import { normalizeTrainingAccess } from './users-training-access.utils';
import type { RoleScopeActorWithId } from './users.types';
import { deriveRoleFromLevel } from './users-workforce.utils';

@Injectable()
export class UsersWorkforceService {
  constructor(private readonly prisma: PrismaService) {}

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

  async assignUserRestaurant(
    userId: number,
    restaurantId: number,
    actor?: RoleScopeActorWithId,
  ) {
    const effectiveActor = actor ?? {
      actorId: 0,
      actorRole: Role.ADMIN,
      actorRestaurantId: null,
    };

    ensureAdminOrManagerScope(effectiveActor);

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
      throw new BadRequestException(
        'Cannot assign restaurant to ADMIN via this endpoint',
      );
    }

    if (effectiveActor.actorRole === Role.MANAGER) {
      if (user.role !== Role.EMPLOYEE) {
        throw new BadRequestException(
          'Manager can only move EMPLOYEE accounts',
        );
      }

      if (user.restaurantId !== effectiveActor.actorRestaurantId) {
        throw new BadRequestException(
          'Manager can only move employees from own restaurant',
        );
      }
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
      throw new BadRequestException(
        'Admin cannot edit own role in this endpoint',
      );
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
        employeeLevel: true,
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
      trainingAccess: normalizeTrainingAccess(updatedUser.trainingAccess),
    };
  }

  async updateEmployeeLevel(
    userId: number,
    level: EmployeeLevel,
    actor: RoleScopeActorWithId,
  ) {
    if (actor.actorRole !== Role.MANAGER) {
      throw new ForbiddenException('Only MANAGER can update employee level');
    }

    ensureAdminOrManagerScope(actor);

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
      throw new BadRequestException('Cannot update ADMIN level');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Only EMPLOYEE level can be updated');
    }

    if (actor.actorId === userId) {
      throw new BadRequestException('Manager cannot update own level');
    }

    if (user.restaurantId !== actor.actorRestaurantId) {
      throw new BadRequestException(
        'Manager can only update users in own restaurant',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        employeeLevel: level,
        role: deriveRoleFromLevel(level),
        isOnProbation: level === EmployeeLevel.L0_PROBATION,
      },
      select: {
        id: true,
        role: true,
        employeeLevel: true,
        isOnProbation: true,
      },
    });
  }

  async updateEmployeeWorkplaceRole(
    userId: number,
    workplaceRole: WorkplaceRole,
    actor: RoleScopeActorWithId,
  ) {
    ensureAdminOrManagerScope(actor);

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

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException(
        'Only EMPLOYEE workplace role can be updated',
      );
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only update users in own restaurant',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        workplaceRole,
      },
      select: {
        id: true,
        workplaceRole: true,
      },
    });
  }
}
