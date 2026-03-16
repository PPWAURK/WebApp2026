import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    assignUserRestaurant: jest.Mock;
    updateOwnProfile: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      assignUserRestaurant: jest.fn(),
      updateOwnProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get(UsersController);
  });

  it('rejects non-admin users when updating their own profile name', () => {
    expect(() =>
      controller.updateOwnProfile(
        {
          user: {
            id: 12,
            role: Role.EMPLOYEE,
            restaurantId: 3,
          },
        } as never,
        'Alice',
      ),
    ).toThrow(new ForbiddenException('Only ADMIN can update own profile name'));

    expect(usersService.updateOwnProfile).not.toHaveBeenCalled();
  });

  it('allows admins to update their own profile name', () => {
    const expected = {
      id: 1,
      name: 'Alice',
    };
    usersService.updateOwnProfile.mockReturnValue(expected);

    const result = controller.updateOwnProfile(
      {
        user: {
          id: 1,
          role: Role.ADMIN,
          restaurantId: null,
        },
      } as never,
      '  Alice  ',
    );

    expect(usersService.updateOwnProfile).toHaveBeenCalledWith(1, {
      name: 'Alice',
    });
    expect(result).toBe(expected);
  });

  it('allows managers to move one employee to another restaurant', () => {
    const expected = {
      id: 22,
      restaurantId: 5,
    };
    usersService.assignUserRestaurant.mockReturnValue(expected);

    const result = controller.updateUserRestaurant(
      {
        user: {
          id: 8,
          role: Role.MANAGER,
          restaurantId: 3,
        },
      } as never,
      22,
      5,
    );

    expect(usersService.assignUserRestaurant).toHaveBeenCalledWith(22, 5, {
      actorId: 8,
      actorRole: Role.MANAGER,
      actorRestaurantId: 3,
    });
    expect(result).toBe(expected);
  });

  it('rejects employees when moving one user to another restaurant', () => {
    expect(() =>
      controller.updateUserRestaurant(
        {
          user: {
            id: 12,
            role: Role.EMPLOYEE,
            restaurantId: 3,
          },
        } as never,
        22,
        5,
      ),
    ).toThrow(
      new ForbiddenException('Only ADMIN and MANAGER can access this resource'),
    );

    expect(usersService.assignUserRestaurant).not.toHaveBeenCalled();
  });
});
