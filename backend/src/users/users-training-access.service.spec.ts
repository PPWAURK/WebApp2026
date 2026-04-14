import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersTrainingAccessService } from './users-training-access.service';

describe('UsersTrainingAccessService', () => {
  let service: UsersTrainingAccessService;
  let usersService: {
    deleteExpiredPendingEmailVerificationUsers: jest.Mock;
  };
  let prisma: {
    trainingQuizLink: {
      deleteMany: jest.Mock;
      upsert: jest.Mock;
    };
    employeeLevelAccessProfile: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    usersService = {
      deleteExpiredPendingEmailVerificationUsers: jest.fn(),
    };
    prisma = {
      trainingQuizLink: {
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      },
      employeeLevelAccessProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new UsersTrainingAccessService(
      prisma as never,
      usersService as never,
    );
  });

  it('rejects invalid quiz URLs before writing them', async () => {
    await expect(
      service.upsertTrainingQuizLink(
        'RECIPE',
        'fr',
        'ftp://example.com/quiz',
        Role.ADMIN,
      ),
    ).rejects.toThrow(new BadRequestException('quizUrl must be a valid URL'));

    expect(prisma.trainingQuizLink.upsert).not.toHaveBeenCalled();
    expect(prisma.trainingQuizLink.deleteMany).not.toHaveBeenCalled();
  });

  it('returns every training section for admins without querying profiles', async () => {
    const result = await service.getTrainingAccessByLevel(
      'L1_PARTNER' as never,
      Role.ADMIN,
    );

    expect(result).toEqual([
      'RECIPE_TRAINING',
      'RECIPE',
      'MISE_EN_PLACE_SOP',
      'RED_RULES',
      'BLACK_RULES',
      'SALLE_TOOLS',
      'CUISINE_TOOLS',
      'MEAT_DATE_FORM',
      'CLEANING_FORM',
    ]);
    expect(prisma.employeeLevelAccessProfile.findUnique).not.toHaveBeenCalled();
  });

  it('rejects non-training sections when saving quiz links', async () => {
    await expect(
      service.upsertTrainingQuizLink(
        'ORDER_RETURNS',
        'fr',
        'https://example.com/quiz',
        Role.ADMIN,
      ),
    ).rejects.toThrow(new BadRequestException('Invalid training section'));

    expect(prisma.trainingQuizLink.upsert).not.toHaveBeenCalled();
  });

  it('exposes whether a pending account has verified its email', async () => {
    usersService.deleteExpiredPendingEmailVerificationUsers.mockResolvedValue(
      0,
    );
    prisma.user.findMany.mockResolvedValue([
      {
        id: 3,
        email: 'employee@example.com',
        name: 'Employee',
        profilePhoto: null,
        restaurantId: 2,
        restaurant: {
          id: 2,
          name: 'Paris',
        },
        managedRestaurants: [],
        role: Role.EMPLOYEE,
        workplaceRole: 'BOTH',
        employeeLevel: 'L0_PROBATION',
        isApproved: false,
        emailVerifiedAt: new Date('2026-03-24T10:00:00.000Z'),
        isOnProbation: true,
      },
    ]);
    prisma.employeeLevelAccessProfile.findMany.mockResolvedValue([]);

    const result = await service.listUsersTrainingAccess(undefined, {
      actorId: 1,
      actorRole: Role.ADMIN,
      actorRestaurantId: null,
      actorManagedRestaurantIds: [],
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 3,
        isApproved: false,
        isEmailVerified: true,
      }),
    ]);
    expect(
      usersService.deleteExpiredPendingEmailVerificationUsers,
    ).toHaveBeenCalledWith();
  });
});
