import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let prisma: {
    restaurant: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      restaurant: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new RestaurantsService(prisma as never);
  });

  it('trims name and address before creating a restaurant', async () => {
    prisma.restaurant.create.mockResolvedValue({
      id: 1,
      name: 'Paris 11',
      address: '12 Rue Exemple',
    });

    await service.createRestaurant({
      name: '  Paris 11  ',
      address: '  12 Rue Exemple  ',
    });

    expect(prisma.restaurant.create).toHaveBeenCalledWith({
      data: {
        name: 'Paris 11',
        address: '12 Rue Exemple',
      },
    });
  });

  it('maps duplicate restaurant names to a conflict error', async () => {
    prisma.restaurant.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate name', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createRestaurant({
        name: 'Paris 11',
        address: '12 Rue Exemple',
      }),
    ).rejects.toThrow(
      new ConflictException('Restaurant name already exists'),
    );
  });

  it('maps oversized values to a bad request error', async () => {
    prisma.restaurant.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Value too long', {
        code: 'P2000',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createRestaurant({
        name: 'Paris 11',
        address: '12 Rue Exemple',
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Restaurant name or address exceeds the allowed length',
      ),
    );
  });
});
