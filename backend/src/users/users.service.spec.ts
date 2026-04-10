import { BadRequestException } from '@nestjs/common';
import { EmployeeLevel, Role } from '@prisma/client';
import { UsersWorkforceService } from './users-workforce.service';

describe('UsersWorkforceService', () => {
  let service: UsersWorkforceService;
  let prisma: {
    restaurant: {
      findUnique: jest.Mock;
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

  it('rejects admins updating a manager level', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 14,
      role: Role.EMPLOYEE,
      restaurantId: 9,
    });

    await expect(
      service.updateEmployeeLevel(14, EmployeeLevel.L6_MA, {
        actorId: 1,
        actorRole: Role.ADMIN,
        actorRestaurantId: null,
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Admin must use manager role update for manager accounts',
      ),
    );

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
