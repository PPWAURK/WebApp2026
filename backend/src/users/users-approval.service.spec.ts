import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersApprovalService } from './users-approval.service';

describe('UsersApprovalService', () => {
  let service: UsersApprovalService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let mailService: {
    sendAccountApprovedEmail: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    mailService = {
      sendAccountApprovedEmail: jest.fn(),
    };

    service = new UsersApprovalService(prisma as never, mailService as never);
  });

  it('rejects account approval when the email is not verified yet', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 12,
      role: Role.EMPLOYEE,
      restaurantId: 5,
      isApproved: false,
      emailVerifiedAt: null,
    });

    await expect(
      service.approveEmployeeAccount(12, {
        actorRole: Role.MANAGER,
        actorRestaurantId: 5,
      }),
    ).rejects.toThrow(
      new BadRequestException('Email must be verified before account review'),
    );

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(mailService.sendAccountApprovedEmail).not.toHaveBeenCalled();
  });
});
