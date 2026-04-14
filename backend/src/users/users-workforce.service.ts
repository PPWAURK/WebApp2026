import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, Prisma, Role, WorkplaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  canActorManageRestaurant,
  ensureAdminOrManagerScope,
} from './users-scope';
import { normalizeTrainingAccess } from './users-training-access.utils';
import type { RoleScopeActorWithId } from './users.types';
import { deriveRoleFromLevel } from './users-workforce.utils';

const SUPERVISOR_PROFILE_SELECT = {
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
  managedRestaurants: {
    select: {
      restaurant: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  },
} as const;

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
      actorManagedRestaurantIds: [],
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

    if (effectiveActor.actorRole === Role.REGIONAL_MANAGER) {
      if (user.role !== Role.EMPLOYEE) {
        throw new BadRequestException(
          'Regional manager can only move EMPLOYEE accounts',
        );
      }

      if (!canActorManageRestaurant(effectiveActor, user.restaurantId)) {
        throw new BadRequestException(
          'Regional manager can only move employees from assigned restaurants',
        );
      }

      if (!canActorManageRestaurant(effectiveActor, restaurantId)) {
        throw new BadRequestException(
          'Regional manager can only move employees to assigned restaurants',
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
    return this.updateSupervisorRole(userId, {
      role: params.isManager ? Role.MANAGER : Role.EMPLOYEE,
      primaryRestaurantId: params.restaurantId,
      managedRestaurantIds: [],
      actorId: params.actorId,
    });
  }

  async updateSupervisorRole(
    userId: number,
    params: {
      role: Role;
      primaryRestaurantId?: number;
      managedRestaurantIds?: number[];
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

    if (
      params.role !== Role.EMPLOYEE &&
      params.role !== Role.MANAGER &&
      params.role !== Role.REGIONAL_MANAGER
    ) {
      throw new BadRequestException('Unsupported supervisor role');
    }

    const primaryRestaurantId = params.primaryRestaurantId ?? user.restaurantId;
    const managedRestaurantIds = this.normalizeManagedRestaurantIds(
      params.managedRestaurantIds,
    );

    if (params.role === Role.MANAGER && !primaryRestaurantId) {
      throw new BadRequestException('Manager must be assigned to a restaurant');
    }

    if (
      params.role === Role.REGIONAL_MANAGER &&
      managedRestaurantIds.length === 0
    ) {
      throw new BadRequestException(
        'Regional manager must be assigned to at least one restaurant',
      );
    }

    if (
      params.role === Role.REGIONAL_MANAGER &&
      (!primaryRestaurantId ||
        !managedRestaurantIds.includes(primaryRestaurantId))
    ) {
      throw new BadRequestException(
        'Regional manager primary restaurant must belong to assigned restaurants',
      );
    }

    const restaurantIdsToValidate = new Set<number>();
    if (primaryRestaurantId) {
      restaurantIdsToValidate.add(primaryRestaurantId);
    }
    for (const restaurantId of managedRestaurantIds) {
      restaurantIdsToValidate.add(restaurantId);
    }

    if (restaurantIdsToValidate.size > 0) {
      const restaurants = await this.prisma.restaurant.findMany({
        where: {
          id: {
            in: Array.from(restaurantIdsToValidate),
          },
        },
        select: { id: true },
      });

      if (restaurants.length !== restaurantIdsToValidate.size) {
        throw new NotFoundException('Restaurant not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: params.role,
        restaurantId:
          params.role === Role.REGIONAL_MANAGER || params.role === Role.MANAGER
            ? (primaryRestaurantId ?? null)
            : params.primaryRestaurantId !== undefined
              ? params.primaryRestaurantId
              : user.restaurantId,
        managedRestaurants:
          params.role === Role.REGIONAL_MANAGER
            ? {
                deleteMany: {},
                create: managedRestaurantIds.map((restaurantId) => ({
                  restaurant: {
                    connect: { id: restaurantId },
                  },
                })),
              }
            : {
                deleteMany: {},
              },
      },
      select: SUPERVISOR_PROFILE_SELECT,
    });

    return this.formatSupervisorProfile(updatedUser);
  }

  async updateEmployeeLevel(
    userId: number,
    level: EmployeeLevel,
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

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot update ADMIN level');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Only EMPLOYEE level can be updated');
    }

    if (
      actor.actorRole === Role.ADMIN &&
      deriveRoleFromLevel(level) === Role.MANAGER
    ) {
      throw new BadRequestException(
        'Admin must use manager role update for manager accounts',
      );
    }

    if (actor.actorId === userId) {
      throw new BadRequestException('Cannot update own level');
    }

    if (
      actor.actorRole !== Role.ADMIN &&
      !canActorManageRestaurant(actor, user.restaurantId)
    ) {
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
      actor.actorRole !== Role.ADMIN &&
      !canActorManageRestaurant(actor, user.restaurantId)
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

  private normalizeManagedRestaurantIds(
    restaurantIds: number[] | undefined,
  ): number[] {
    if (!restaurantIds) {
      return [];
    }

    if (
      !Array.isArray(restaurantIds) ||
      restaurantIds.some(
        (restaurantId) => !Number.isInteger(restaurantId) || restaurantId <= 0,
      )
    ) {
      throw new BadRequestException(
        'managedRestaurantIds must contain positive integers only',
      );
    }

    return Array.from(new Set(restaurantIds));
  }

  private formatSupervisorProfile(user: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
    employeeLevel: EmployeeLevel;
    restaurantId: number | null;
    isApproved: boolean;
    isOnProbation: boolean;
    trainingAccess: Prisma.JsonValue;
    restaurant: {
      id: number;
      name: string;
      address: string;
    } | null;
    managedRestaurants: Array<{
      restaurant: {
        id: number;
        name: string;
        address: string;
      };
    }>;
  }) {
    return {
      ...user,
      managedRestaurants: user.managedRestaurants.map((entry) => ({
        ...entry.restaurant,
      })),
      trainingAccess: normalizeTrainingAccess(user.trainingAccess),
    };
  }
}
