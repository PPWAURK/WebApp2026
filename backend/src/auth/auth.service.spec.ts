import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

type UserEmailVerificationUpdateArgs = {
  where: { id: number };
  data: { emailVerifiedAt: Date };
};

type EmailVerificationTokenUpdateManyArgs = {
  where: { userId: number; consumedAt: null };
  data: { consumedAt: Date };
};

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
    ).rejects.toThrow(new UnauthorizedException('EMAIL_VERIFICATION_REQUIRED'));
  });

  it('marks the email as verified before entering admin approval', async () => {
    let userUpdateArgs: UserEmailVerificationUpdateArgs | null = null;
    let tokenUpdateManyArgs: EmailVerificationTokenUpdateManyArgs | null = null;

    prisma.emailVerificationToken.findFirst.mockResolvedValue({
      id: 10,
      user: {
        id: 7,
        role: Role.MANAGER,
        emailVerifiedAt: null,
      },
    });
    prisma.user.update.mockImplementation(
      (args: UserEmailVerificationUpdateArgs) => {
        userUpdateArgs = args;
        return Promise.resolve({ id: 7 });
      },
    );
    prisma.emailVerificationToken.updateMany.mockImplementation(
      (args: EmailVerificationTokenUpdateManyArgs) => {
        tokenUpdateManyArgs = args;
        return Promise.resolve({ count: 1 });
      },
    );
    prisma.$transaction.mockResolvedValue(undefined);

    const result = await service.verifyEmail({ token: 'plain-token' });

    expect(userUpdateArgs).not.toBeNull();
    expect(tokenUpdateManyArgs).not.toBeNull();

    if (!userUpdateArgs || !tokenUpdateManyArgs) {
      throw new Error('Expected verification update arguments to be captured');
    }

    const capturedUserUpdateArgs: UserEmailVerificationUpdateArgs =
      userUpdateArgs;
    const capturedTokenUpdateManyArgs: EmailVerificationTokenUpdateManyArgs =
      tokenUpdateManyArgs;

    expect(capturedUserUpdateArgs.where).toEqual({ id: 7 });
    expect(capturedUserUpdateArgs.data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(capturedTokenUpdateManyArgs.where).toEqual({
      userId: 7,
      consumedAt: null,
    });
    expect(capturedTokenUpdateManyArgs.data.consumedAt).toBeInstanceOf(Date);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'ACCOUNT_PENDING_ADMIN_APPROVAL',
    });
  });
});
