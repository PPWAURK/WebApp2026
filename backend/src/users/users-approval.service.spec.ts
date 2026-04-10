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

  it('allows admins to delete a manager account', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 24,
      role: Role.MANAGER,
      restaurantId: 5,
    });
    prisma.user.delete.mockResolvedValue({
      id: 24,
    });

    await expect(
      service.deleteEmployeeAccount(24, {
        actorRole: Role.ADMIN,
        actorRestaurantId: null,
      }),
    ).resolves.toEqual({
      success: true,
      id: 24,
    });
  });

  it('rejects deleting admin accounts', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      role: Role.ADMIN,
      restaurantId: null,
    });

    await expect(
      service.deleteEmployeeAccount(2, {
        actorRole: Role.ADMIN,
        actorRestaurantId: null,
      }),
    ).rejects.toThrow(
      new BadRequestException('ADMIN accounts cannot be deleted'),
    );

    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
