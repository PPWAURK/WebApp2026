import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersApprovalService } from './users-approval.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersTrainingAccessService } from './users-training-access.service';
import { UsersWorkforceService } from './users-workforce.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersProfileService: {
    updateOwnEmail: jest.Mock;
    updateOwnPassword: jest.Mock;
    updateOwnProfile: jest.Mock;
  };
  let usersWorkforceService: {
    assignUserRestaurant: jest.Mock;
    updateEmployeeLevel: jest.Mock;
  };

  beforeEach(async () => {
    usersProfileService = {
      updateOwnEmail: jest.fn(),
      updateOwnPassword: jest.fn(),
      updateOwnProfile: jest.fn(),
    };
    usersWorkforceService = {
      assignUserRestaurant: jest.fn(),
      updateEmployeeLevel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersProfileService,
        },
        {
          provide: UsersTrainingAccessService,
          useValue: {},
        },
        {
          provide: UsersWorkforceService,
          useValue: usersWorkforceService,
        },
        {
          provide: UsersApprovalService,
          useValue: {},
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

    expect(usersProfileService.updateOwnProfile).not.toHaveBeenCalled();
  });

  it('allows admins to update their own profile name', () => {
    const expected = {
      id: 1,
      name: 'Alice',
    };
    usersProfileService.updateOwnProfile.mockReturnValue(expected);

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

    expect(usersProfileService.updateOwnProfile).toHaveBeenCalledWith(1, {
      name: 'Alice',
    });
    expect(result).toBe(expected);
  });

  it('allows authenticated users to update their own email', () => {
    const expected = {
      id: 1,
      email: 'alice@example.com',
    };
    usersProfileService.updateOwnEmail.mockReturnValue(expected);

    const result = controller.updateOwnEmail(
      {
        user: {
          id: 1,
          role: Role.EMPLOYEE,
          restaurantId: 3,
        },
      } as never,
      {
        email: 'alice@example.com',
        currentPassword: 'Password123',
      },
    );

    expect(usersProfileService.updateOwnEmail).toHaveBeenCalledWith(1, {
      email: 'alice@example.com',
      currentPassword: 'Password123',
    });
    expect(result).toBe(expected);
  });

  it('allows authenticated users to update their own password', () => {
    const expected = { success: true };
    usersProfileService.updateOwnPassword.mockReturnValue(expected);

    const result = controller.updateOwnPassword(
      {
        user: {
          id: 1,
          role: Role.EMPLOYEE,
          restaurantId: 3,
        },
      } as never,
      {
        currentPassword: 'Password123',
        newPassword: 'Password456',
      },
    );

    expect(usersProfileService.updateOwnPassword).toHaveBeenCalledWith(1, {
      currentPassword: 'Password123',
      newPassword: 'Password456',
    });
    expect(result).toBe(expected);
  });

  it('allows managers to move one employee to another restaurant', () => {
    const expected = {
      id: 22,
      restaurantId: 5,
    };
    usersWorkforceService.assignUserRestaurant.mockReturnValue(expected);

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

    expect(usersWorkforceService.assignUserRestaurant).toHaveBeenCalledWith(
      22,
      5,
      {
        actorId: 8,
        actorRole: Role.MANAGER,
        actorRestaurantId: 3,
      },
    );
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

    expect(usersWorkforceService.assignUserRestaurant).not.toHaveBeenCalled();
  });

  it('allows admins to update one employee level', () => {
    const expected = {
      id: 22,
      employeeLevel: Role.EMPLOYEE,
    };
    usersWorkforceService.updateEmployeeLevel.mockReturnValue(expected);

    const result = controller.updateEmployeeLevel(
      {
        user: {
          id: 1,
          role: Role.ADMIN,
          restaurantId: null,
        },
      } as never,
      22,
      'L4_EXCELLENT',
    );

    expect(usersWorkforceService.updateEmployeeLevel).toHaveBeenCalledWith(
      22,
      'L4_EXCELLENT',
      {
        actorId: 1,
        actorRole: Role.ADMIN,
        actorRestaurantId: null,
      },
    );
    expect(result).toBe(expected);
  });
});
