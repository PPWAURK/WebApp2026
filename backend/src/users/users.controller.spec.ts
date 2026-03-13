import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { updateOwnProfile: jest.Mock };

  beforeEach(async () => {
    usersService = {
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
});
