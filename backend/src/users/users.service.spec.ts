import { BadRequestException } from '@nestjs/common';
import { EmployeeLevel, Role } from '@prisma/client';
import { UsersWorkforceService } from './users-workforce.service';

describe('UsersWorkforceService', () => {
  let service: UsersWorkforceService;
  let prisma: {
    restaurant: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      restaurant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new UsersWorkforceService(prisma as never);
  });

  it('allows a manager to move an employee from their own restaurant', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ id: 4 });
    prisma.user.findUnique.mockResolvedValue({
      id: 12,
      role: Role.EMPLOYEE,
      restaurantId: 2,
    });
    prisma.user.update.mockResolvedValue({
      id: 12,
      restaurantId: 4,
      restaurant: {
        id: 4,
        name: 'Lyon',
        address: 'Rue de Lyon',
      },
    });

    const result = await service.assignUserRestaurant(12, 4, {
      actorId: 7,
      actorRole: Role.MANAGER,
      actorRestaurantId: 2,
      actorManagedRestaurantIds: [],
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: { restaurantId: 4 },
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
    expect(result).toMatchObject({
      id: 12,
      restaurantId: 4,
    });
  });

  it('rejects a manager moving an employee outside their own restaurant', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ id: 4 });
    prisma.user.findUnique.mockResolvedValue({
      id: 12,
      role: Role.EMPLOYEE,
      restaurantId: 9,
    });

    await expect(
      service.assignUserRestaurant(12, 4, {
        actorId: 7,
        actorRole: Role.MANAGER,
        actorRestaurantId: 2,
        actorManagedRestaurantIds: [],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Manager can only move employees from own restaurant',
      ),
    );
  });

  it('rejects a manager moving another manager account', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ id: 4 });
    prisma.user.findUnique.mockResolvedValue({
      id: 12,
      role: Role.MANAGER,
      restaurantId: 2,
    });

    await expect(
      service.assignUserRestaurant(12, 4, {
        actorId: 7,
        actorRole: Role.MANAGER,
        actorRestaurantId: 2,
        actorManagedRestaurantIds: [],
      }),
    ).rejects.toThrow(
      new BadRequestException('Manager can only move EMPLOYEE accounts'),
    );
  });

  it('allows admins to update one employee level', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 14,
      role: Role.EMPLOYEE,
      restaurantId: 9,
    });
    prisma.user.update.mockResolvedValue({
      id: 14,
      role: Role.EMPLOYEE,
      employeeLevel: EmployeeLevel.L4_EXCELLENT,
      isOnProbation: false,
    });

    const result = await service.updateEmployeeLevel(
      14,
      EmployeeLevel.L4_EXCELLENT,
      {
        actorId: 1,
        actorRole: Role.ADMIN,
        actorRestaurantId: null,
        actorManagedRestaurantIds: [],
      },
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 14 },
      data: {
        employeeLevel: EmployeeLevel.L4_EXCELLENT,
        role: Role.EMPLOYEE,
        isOnProbation: false,
      },
      select: {
        id: true,
        role: true,
        employeeLevel: true,
        isOnProbation: true,
      },
    });
    expect(result).toMatchObject({
      id: 14,
      role: Role.EMPLOYEE,
      employeeLevel: EmployeeLevel.L4_EXCELLENT,
      isOnProbation: false,
    });
  });

  it('allows admins to promote an employee to manager level', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 14,
      role: Role.EMPLOYEE,
      restaurantId: 9,
    });
    prisma.user.update.mockResolvedValue({
      id: 14,
      role: Role.MANAGER,
      employeeLevel: EmployeeLevel.L6_MA,
      isOnProbation: false,
    });

    const result = await service.updateEmployeeLevel(14, EmployeeLevel.L6_MA, {
      actorId: 1,
      actorRole: Role.ADMIN,
      actorRestaurantId: null,
      actorManagedRestaurantIds: [],
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 14 },
      data: {
        employeeLevel: EmployeeLevel.L6_MA,
        role: Role.MANAGER,
        isOnProbation: false,
      },
      select: {
        id: true,
        role: true,
        employeeLevel: true,
        isOnProbation: true,
      },
    });
    expect(result).toMatchObject({
      id: 14,
      role: Role.MANAGER,
      employeeLevel: EmployeeLevel.L6_MA,
      isOnProbation: false,
    });
  });

  it('allows a regional manager to move an employee between assigned restaurants', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ id: 4 });
    prisma.user.findUnique.mockResolvedValue({
      id: 12,
      role: Role.EMPLOYEE,
      restaurantId: 2,
    });
    prisma.user.update.mockResolvedValue({
      id: 12,
      restaurantId: 4,
      restaurant: {
        id: 4,
        name: 'Lyon',
        address: 'Rue de Lyon',
      },
    });

    const result = await service.assignUserRestaurant(12, 4, {
      actorId: 9,
      actorRole: Role.REGIONAL_MANAGER,
      actorRestaurantId: 2,
      actorManagedRestaurantIds: [2, 4],
    });

    expect(result).toMatchObject({
      id: 12,
      restaurantId: 4,
    });
  });
});
