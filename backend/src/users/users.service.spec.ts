import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersWorkforceService } from './users-workforce.service';

describe('UsersWorkforceService.assignUserRestaurant', () => {
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
});
