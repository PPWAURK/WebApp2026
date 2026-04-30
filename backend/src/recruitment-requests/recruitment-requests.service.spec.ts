import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  RecruitmentContractType,
  RecruitmentRequestStatus,
  Role,
} from '@prisma/client';
import {
  recruitmentRequestSelect,
  RecruitmentRequestsService,
} from './recruitment-requests.service';

describe('RecruitmentRequestsService', () => {
  let service: RecruitmentRequestsService;
  let prisma: {
    restaurant: {
      findUnique: jest.Mock;
    };
    recruitmentRequest: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  const baseRequestRow = {
    id: 11,
    restaurant: {
      id: 3,
      name: 'ZHAO Paris 11',
      address: '12 Rue Exemple',
    },
    createdByUser: {
      id: 7,
      name: 'Manager Zhao',
      email: 'manager@example.com',
    },
    position: 'Serveur polyvalent',
    contractType: RecruitmentContractType.FULL_TIME,
    headcount: 2,
    notes: null,
    status: RecruitmentRequestStatus.PENDING,
    processedByUser: null,
    processedAt: null,
    createdAt: new Date('2026-04-30T09:00:00.000Z'),
    updatedAt: new Date('2026-04-30T09:00:00.000Z'),
  };

  beforeEach(() => {
    jest.useRealTimers();
    prisma = {
      restaurant: {
        findUnique: jest.fn().mockResolvedValue({ id: 3 }),
      },
      recruitmentRequest: {
        create: jest.fn().mockResolvedValue(baseRequestRow),
        findMany: jest.fn().mockResolvedValue([baseRequestRow]),
        update: jest.fn().mockResolvedValue({
          ...baseRequestRow,
          status: RecruitmentRequestStatus.PROCESSED,
          processedByUser: {
            id: 1,
            name: 'Admin',
            email: 'admin@example.com',
          },
          processedAt: new Date('2026-04-30T10:00:00.000Z'),
        }),
      },
    };
    service = new RecruitmentRequestsService(prisma as never);
  });

  it('creates manager requests with the manager restaurant', async () => {
    const result = await service.createRecruitmentRequest(
      {
        id: 7,
        role: Role.MANAGER,
        restaurantId: 3,
        managedRestaurantIds: [],
      },
      {
        restaurantId: 99,
        position: ' Serveur polyvalent ',
        contractType: RecruitmentContractType.FULL_TIME,
        headcount: 2,
        notes: ' ',
      },
    );

    expect(prisma.recruitmentRequest.create).toHaveBeenCalledWith({
      data: {
        restaurantId: 3,
        createdByUserId: 7,
        position: 'Serveur polyvalent',
        contractType: RecruitmentContractType.FULL_TIME,
        headcount: 2,
        notes: null,
      },
      select: recruitmentRequestSelect,
    });
    expect(result).toMatchObject({
      id: 11,
      restaurant: {
        id: 3,
      },
      notes: '',
    });
  });

  it('rejects managers without an assigned restaurant', async () => {
    await expect(
      service.createRecruitmentRequest(
        {
          id: 7,
          role: Role.MANAGER,
          restaurantId: null,
          managedRestaurantIds: [],
        },
        {
          position: 'Serveur',
          contractType: RecruitmentContractType.PART_TIME,
          headcount: 1,
        },
      ),
    ).rejects.toThrow(
      new BadRequestException('Manager must be assigned to a restaurant'),
    );
  });

  it('rejects regional manager requests outside their scope', async () => {
    await expect(
      service.createRecruitmentRequest(
        {
          id: 8,
          role: Role.REGIONAL_MANAGER,
          restaurantId: 3,
          managedRestaurantIds: [3, 4],
        },
        {
          restaurantId: 9,
          position: 'Cuisinier',
          contractType: RecruitmentContractType.FULL_TIME,
          headcount: 1,
        },
      ),
    ).rejects.toThrow(
      new ForbiddenException('Restaurant is outside your scope'),
    );
  });

  it('rejects employee submissions', async () => {
    await expect(
      service.createRecruitmentRequest(
        {
          id: 9,
          role: Role.EMPLOYEE,
          restaurantId: 3,
          managedRestaurantIds: [],
        },
        {
          position: 'Serveur',
          contractType: RecruitmentContractType.PART_TIME,
          headcount: 1,
        },
      ),
    ).rejects.toThrow(new ForbiddenException('Manager role required'));
  });

  it('lists filtered recruitment requests for admins', async () => {
    const result = await service.listRecruitmentRequests(
      {
        id: 1,
        role: Role.ADMIN,
        restaurantId: null,
        managedRestaurantIds: [],
      },
      RecruitmentRequestStatus.PENDING,
    );

    expect(prisma.recruitmentRequest.findMany).toHaveBeenCalledWith({
      where: { status: RecruitmentRequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: recruitmentRequestSelect,
    });
    expect(result).toHaveLength(1);
  });

  it('rejects non-admin list access', async () => {
    await expect(
      service.listRecruitmentRequests({
        id: 7,
        role: Role.MANAGER,
        restaurantId: 3,
        managedRestaurantIds: [],
      }),
    ).rejects.toThrow(new ForbiddenException('Admin only'));
  });

  it('marks a request as processed for admins', async () => {
    const processedAt = new Date('2026-04-30T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(processedAt);

    const result = await service.updateRecruitmentRequestStatus(
      {
        id: 1,
        role: Role.ADMIN,
        restaurantId: null,
        managedRestaurantIds: [],
      },
      11,
      RecruitmentRequestStatus.PROCESSED,
    );

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: {
        status: RecruitmentRequestStatus.PROCESSED,
        processedByUserId: 1,
        processedAt,
      },
      select: recruitmentRequestSelect,
    });
    expect(result.status).toBe(RecruitmentRequestStatus.PROCESSED);
  });
});
