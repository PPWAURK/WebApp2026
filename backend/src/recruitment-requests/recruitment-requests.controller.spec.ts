import { ForbiddenException } from '@nestjs/common';
import {
  RecruitmentContractType,
  RecruitmentRequestStatus,
} from '@prisma/client';
import { RecruitmentRequestsController } from './recruitment-requests.controller';

describe('RecruitmentRequestsController', () => {
  let controller: RecruitmentRequestsController;
  let recruitmentRequestsService: {
    createRecruitmentRequest: jest.Mock;
    listRecruitmentRequests: jest.Mock;
    updateRecruitmentRequestStatus: jest.Mock;
  };

  beforeEach(() => {
    recruitmentRequestsService = {
      createRecruitmentRequest: jest.fn(),
      listRecruitmentRequests: jest.fn(),
      updateRecruitmentRequestStatus: jest.fn(),
    };

    controller = new RecruitmentRequestsController(
      recruitmentRequestsService as never,
    );
  });

  it('forwards manager submissions with actor scope', () => {
    const expected = { id: 12 };
    recruitmentRequestsService.createRecruitmentRequest.mockReturnValue(
      expected,
    );

    const result = controller.createRecruitmentRequest(
      {
        user: {
          id: 7,
          role: 'MANAGER',
          restaurantId: 3,
          managedRestaurants: [],
        },
      } as never,
      {
        position: 'Serveur',
        contractType: RecruitmentContractType.FULL_TIME,
        headcount: 2,
      },
    );

    expect(
      recruitmentRequestsService.createRecruitmentRequest,
    ).toHaveBeenCalledWith(
      {
        id: 7,
        role: 'MANAGER',
        restaurantId: 3,
        managedRestaurantIds: [],
      },
      {
        position: 'Serveur',
        contractType: RecruitmentContractType.FULL_TIME,
        headcount: 2,
      },
    );
    expect(result).toBe(expected);
  });

  it('forwards admin list requests with the status filter', () => {
    recruitmentRequestsService.listRecruitmentRequests.mockReturnValue([]);

    const result = controller.listRecruitmentRequests(
      {
        user: {
          id: 1,
          role: 'ADMIN',
          managedRestaurants: [],
        },
      } as never,
      {
        status: RecruitmentRequestStatus.PENDING,
      },
    );

    expect(
      recruitmentRequestsService.listRecruitmentRequests,
    ).toHaveBeenCalledWith(
      {
        id: 1,
        role: 'ADMIN',
        restaurantId: null,
        managedRestaurantIds: [],
      },
      RecruitmentRequestStatus.PENDING,
    );
    expect(result).toEqual([]);
  });

  it('forwards admin status updates with the request id', () => {
    const expected = { id: 12, status: RecruitmentRequestStatus.PROCESSED };
    recruitmentRequestsService.updateRecruitmentRequestStatus.mockReturnValue(
      expected,
    );

    const result = controller.updateRecruitmentRequestStatus(
      {
        user: {
          id: 1,
          role: 'ADMIN',
          managedRestaurants: [],
        },
      } as never,
      12,
      {
        status: RecruitmentRequestStatus.PROCESSED,
      },
    );

    expect(
      recruitmentRequestsService.updateRecruitmentRequestStatus,
    ).toHaveBeenCalledWith(
      {
        id: 1,
        role: 'ADMIN',
        restaurantId: null,
        managedRestaurantIds: [],
      },
      12,
      RecruitmentRequestStatus.PROCESSED,
    );
    expect(result).toBe(expected);
  });

  it('rejects unauthenticated requests', () => {
    expect(() =>
      controller.listRecruitmentRequests({ user: undefined } as never, {}),
    ).toThrow(new ForbiddenException('Unauthenticated request'));
  });
});
