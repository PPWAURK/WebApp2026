import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

describe('UsersService credential updates', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new UsersService(prisma as never);
  });

  it('updates the current user email when the current password is valid', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);

    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: 7,
        email: 'old@example.com',
        passwordHash,
      })
      .mockResolvedValueOnce(null);
    prisma.user.update.mockResolvedValue({
      id: 7,
      email: 'new@example.com',
      name: 'Alice',
      profilePhoto: null,
      role: 'EMPLOYEE',
      employeeLevel: 'L0_PROBATION',
      isApproved: true,
      isOnProbation: true,
      workplaceRole: 'BOTH',
      trainingAccess: [],
      restaurant: null,
    });

    const result = await service.updateOwnEmail(7, {
      email: '  NEW@example.com  ',
      currentPassword: 'Password123',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        email: 'new@example.com',
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        role: true,
        employeeLevel: true,
        isApproved: true,
        isOnProbation: true,
        workplaceRole: true,
        trainingAccess: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });
    expect(result).toMatchObject({
      id: 7,
      email: 'new@example.com',
      trainingAccess: [],
    });
  });

  it('rejects updating the current user email when the email is already used', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);

    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: 7,
        email: 'old@example.com',
        passwordHash,
      })
      .mockResolvedValueOnce({
        id: 8,
      });

    await expect(
      service.updateOwnEmail(7, {
        email: 'taken@example.com',
        currentPassword: 'Password123',
      }),
    ).rejects.toThrow(new ConflictException('EMAIL_ALREADY_REGISTERED'));

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects updating the current user password when the current password is invalid', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);

    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'alice@example.com',
      passwordHash,
    });

    await expect(
      service.updateOwnPassword(7, {
        currentPassword: 'WrongPassword',
        newPassword: 'Password456',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('CURRENT_PASSWORD_INCORRECT'),
    );

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects updating the current user password when the new password matches the current password', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);

    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'alice@example.com',
      passwordHash,
    });

    await expect(
      service.updateOwnPassword(7, {
        currentPassword: 'Password123',
        newPassword: 'Password123',
      }),
    ).rejects.toThrow(
      new BadRequestException('NEW_PASSWORD_MUST_BE_DIFFERENT'),
    );

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('updates the current user password when the current password is valid', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);

    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'alice@example.com',
      passwordHash,
    });
    prisma.user.update.mockResolvedValue({
      id: 7,
    });

    await expect(
      service.updateOwnPassword(7, {
        currentPassword: 'Password123',
        newPassword: 'Password456',
      }),
    ).resolves.toEqual({ success: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        passwordHash: expect.any(String),
      },
      select: {
        id: true,
      },
    });
  });
});
