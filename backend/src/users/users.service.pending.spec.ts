import { EmployeeLevel, Role } from '@prisma/client';
import { UsersService } from './users.service';

describe('UsersService pending email verification cleanup', () => {
  let service: UsersService;
  let prisma: {
    user: {
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    service = new UsersService(prisma as never);
  });

  it('deletes only accounts that stayed unverified for more than one day', async () => {
    prisma.user.deleteMany.mockResolvedValue({ count: 2 });
    const now = new Date('2026-04-10T12:00:00.000Z');

    const count = await service.deleteExpiredPendingEmailVerificationUsers({
      now,
    });

    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: {
        isApproved: false,
        emailVerifiedAt: null,
        createdAt: {
          lte: new Date('2026-04-09T12:00:00.000Z'),
        },
      },
    });
    expect(count).toBe(2);
  });

  it('derives probation status from the employee level when creating a user', async () => {
    prisma.user.create.mockResolvedValue({
      id: 21,
      role: Role.MANAGER,
      employeeLevel: EmployeeLevel.L7_D,
      isOnProbation: false,
    });

    await service.createEmployee({
      email: 'manager@example.com',
      passwordHash: 'hashed',
      restaurantId: 3,
      role: Role.MANAGER,
      employeeLevel: EmployeeLevel.L7_D,
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: Role.MANAGER,
        employeeLevel: EmployeeLevel.L7_D,
        isOnProbation: false,
      }),
    });
  });
});
