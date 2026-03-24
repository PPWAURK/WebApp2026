import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    createEmployee: jest.Mock;
    updatePreferredLanguage: jest.Mock;
  };
  let usersTrainingAccessService: {
    getTrainingAccessByLevel: jest.Mock;
  };
  let restaurantsService: {
    ensureRestaurantExists: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let prisma: {
    emailVerificationToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
    };
    passwordResetToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    user: {
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mailService: {
    sendEmailVerificationEmail: jest.Mock;
    sendForgotPasswordEmail: jest.Mock;
    sendAccountApprovedEmail: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createEmployee: jest.fn(),
      updatePreferredLanguage: jest.fn(),
    };
    usersTrainingAccessService = {
      getTrainingAccessByLevel: jest.fn(),
    };
    restaurantsService = {
      ensureRestaurantExists: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('15m'),
    };
    prisma = {
      emailVerificationToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    mailService = {
      sendEmailVerificationEmail: jest.fn(),
      sendForgotPasswordEmail: jest.fn(),
      sendAccountApprovedEmail: jest.fn(),
    };

    service = new AuthService(
      usersService as never,
      usersTrainingAccessService as never,
      restaurantsService as never,
      jwtService as never,
      configService as never,
      prisma as never,
      mailService as never,
    );
  });

  it('creates an unverified account and sends a verification email on register', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    restaurantsService.ensureRestaurantExists.mockResolvedValue(undefined);
    usersService.createEmployee.mockResolvedValue({
      id: 18,
      email: 'alice@example.com',
      name: 'Alice',
    });
    prisma.emailVerificationToken.create.mockResolvedValue({
      id: 1,
    });
    mailService.sendEmailVerificationEmail.mockResolvedValue(undefined);

    const result = await service.register({
      email: 'alice@example.com',
      password: 'Password123',
      name: 'Alice',
      restaurantId: 3,
      requestManagerRole: false,
      language: 'zh',
    });

    expect(usersService.createEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        restaurantId: 3,
        isApproved: false,
        emailVerifiedAt: null,
      }),
    );
    expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
    expect(mailService.sendEmailVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        recipientName: 'Alice',
        language: 'zh',
      }),
    );
    expect(result).toEqual({
      pendingApproval: false,
      requiresEmailVerification: true,
      userId: 18,
      message: 'EMAIL_VERIFICATION_REQUIRED',
    });
  });

  it('rejects login before the email is verified', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 7,
      role: Role.EMPLOYEE,
      emailVerifiedAt: null,
      isApproved: false,
      passwordHash: await bcrypt.hash('Password123', 1),
    });

    await expect(
      service.login({
        email: 'alice@example.com',
        password: 'Password123',
        language: 'fr',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('EMAIL_VERIFICATION_REQUIRED'),
    );
  });

  it('marks the email as verified before entering admin approval', async () => {
    prisma.emailVerificationToken.findFirst.mockResolvedValue({
      id: 10,
      user: {
        id: 7,
        role: Role.MANAGER,
        emailVerifiedAt: null,
      },
    });
    prisma.user.update.mockResolvedValue({ id: 7 });
    prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockResolvedValue(undefined);

    const result = await service.verifyEmail({ token: 'plain-token' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        emailVerifiedAt: expect.any(Date),
      },
    });
    expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 7,
        consumedAt: null,
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'ACCOUNT_PENDING_ADMIN_APPROVAL',
    });
  });
});
