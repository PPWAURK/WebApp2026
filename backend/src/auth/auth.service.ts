import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeeLevel, Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { UsersTrainingAccessService } from '../users/users-training-access.service';
import { UsersService } from '../users/users.service';
import { EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS } from './auth.constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersTrainingAccessService: UsersTrainingAccessService,
    private readonly restaurantsService: RestaurantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private readonly resetTokenLifetimeMinutes = 30;
  private readonly resetEmailCooldownMs = 30_000;
  private readonly emailVerificationTokenLifetimeHours =
    EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS;
  private readonly emailVerificationCooldownMs = 30_000;

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('INCORRECT_PASSWORD');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('EMAIL_VERIFICATION_REQUIRED');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException(
        user.role === Role.MANAGER || user.role === Role.REGIONAL_MANAGER
          ? 'ACCOUNT_PENDING_ADMIN_APPROVAL'
          : 'ACCOUNT_PENDING_APPROVAL',
      );
    }

    if (loginDto.language === 'fr' || loginDto.language === 'zh') {
      await this.usersService.updatePreferredLanguage(
        user.id,
        loginDto.language,
      );
    }

    const authenticatedUser = await this.usersService.findById(user.id);

    if (!authenticatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(authenticatedUser);
  }

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    await this.usersService.deleteExpiredPendingEmailVerificationUsers({
      email: normalizedEmail,
    });

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('EMAIL_ALREADY_REGISTERED');
    }

    await this.restaurantsService.ensureRestaurantExists(
      registerDto.restaurantId,
    );

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const createdUser = await this.usersService.createEmployee({
      email: normalizedEmail,
      passwordHash,
      name: registerDto.name,
      restaurantId: registerDto.restaurantId,
      role: registerDto.requestManagerRole ? Role.MANAGER : Role.EMPLOYEE,
      employeeLevel: registerDto.requestManagerRole
        ? EmployeeLevel.L7_D
        : EmployeeLevel.L0_PROBATION,
      isApproved: false,
      emailVerifiedAt: null,
      preferredLanguage:
        registerDto.language === 'fr' || registerDto.language === 'zh'
          ? registerDto.language
          : 'fr',
    });

    const verificationToken = await this.createEmailVerificationToken(
      createdUser.id,
    );

    try {
      await this.mailService.sendEmailVerificationEmail({
        email: createdUser.email,
        recipientName: createdUser.name,
        verificationToken,
        language:
          registerDto.language === 'fr' || registerDto.language === 'zh'
            ? registerDto.language
            : 'fr',
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send verification email for user ${createdUser.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      pendingApproval: false,
      requiresEmailVerification: true,
      userId: createdUser.id,
      message: 'EMAIL_VERIFICATION_REQUIRED',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = this.hashEmailVerificationToken(dto.token);
    const now = new Date();

    const verificationRecord =
      await this.prisma.emailVerificationToken.findFirst({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              emailVerifiedAt: true,
            },
          },
        },
      });

    if (!verificationRecord) {
      throw new UnauthorizedException(
        'INVALID_OR_EXPIRED_EMAIL_VERIFICATION_TOKEN',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationRecord.user.id },
        data: {
          emailVerifiedAt: verificationRecord.user.emailVerifiedAt ?? now,
        },
      }),
      this.prisma.emailVerificationToken.updateMany({
        where: {
          userId: verificationRecord.user.id,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      }),
    ]);

    return {
      success: true,
      message:
        verificationRecord.user.role === Role.MANAGER ||
        verificationRecord.user.role === Role.REGIONAL_MANAGER
          ? 'ACCOUNT_PENDING_ADMIN_APPROVAL'
          : 'ACCOUNT_PENDING_APPROVAL',
    };
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    await this.usersService.deleteExpiredPendingEmailVerificationUsers({
      email: normalizedEmail,
    });

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || user.emailVerifiedAt) {
      return {
        success: true,
        message: 'EMAIL_VERIFICATION_EMAIL_SENT_IF_EXISTS',
      };
    }

    const lastVerificationRequest =
      await this.prisma.emailVerificationToken.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      });

    if (lastVerificationRequest) {
      const elapsedSinceLastRequestMs =
        Date.now() - lastVerificationRequest.createdAt.getTime();

      if (elapsedSinceLastRequestMs < this.emailVerificationCooldownMs) {
        return {
          success: true,
          message: 'EMAIL_VERIFICATION_EMAIL_SENT_IF_EXISTS',
        };
      }
    }

    const verificationToken = await this.createEmailVerificationToken(user.id);

    try {
      const effectiveLanguage =
        dto.language === 'fr' || dto.language === 'zh'
          ? dto.language
          : user.preferredLanguage === 'zh'
            ? 'zh'
            : 'fr';

      await this.mailService.sendEmailVerificationEmail({
        email: user.email,
        recipientName: user.name,
        verificationToken,
        language: effectiveLanguage,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to resend verification email for user ${user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      success: true,
      message: 'EMAIL_VERIFICATION_EMAIL_SENT_IF_EXISTS',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      return {
        success: true,
        message: 'PASSWORD_RESET_EMAIL_SENT_IF_EXISTS',
      };
    }

    const lastResetRequest = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });

    if (lastResetRequest) {
      const elapsedSinceLastRequestMs =
        Date.now() - lastResetRequest.createdAt.getTime();
      if (elapsedSinceLastRequestMs < this.resetEmailCooldownMs) {
        return {
          success: true,
          message: 'PASSWORD_RESET_EMAIL_SENT_IF_EXISTS',
        };
      }
    }

    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(plainToken);
    const expiresAt = new Date(
      Date.now() + this.resetTokenLifetimeMinutes * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    try {
      const effectiveLanguage =
        dto.language === 'fr' || dto.language === 'zh'
          ? dto.language
          : user.preferredLanguage === 'zh'
            ? 'zh'
            : 'fr';

      await this.mailService.sendForgotPasswordEmail({
        email: user.email,
        recipientName: user.name,
        resetToken: plainToken,
        language: effectiveLanguage,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send password reset email for user ${user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      success: true,
      message: 'PASSWORD_RESET_EMAIL_SENT_IF_EXISTS',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.token);
    const now = new Date();

    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!resetRecord) {
      throw new UnauthorizedException('INVALID_OR_EXPIRED_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.user.id },
        data: {
          passwordHash,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: {
          consumedAt: now,
        },
      }),
    ]);

    return {
      success: true,
      message: 'PASSWORD_RESET_SUCCESS',
    };
  }

  private async buildAuthResponse(user: {
    id: number;
    email: string;
    name: string | null;
    profilePhoto: string | null;
    role: string;
    employeeLevel: EmployeeLevel;
    emailVerifiedAt?: Date | null;
    isOnProbation: boolean;
    workplaceRole: string;
    restaurantId: number | null;
    restaurant: { id: number; name: string; address: string } | null;
    managedRestaurants?: Array<{
      restaurant: { id: number; name: string; address: string };
    }>;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      workplaceRole: user.workplaceRole,
    };

    const trainingAccess =
      await this.usersTrainingAccessService.getTrainingAccessByLevel(
        user.employeeLevel,
        user.role,
      );

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
          '15m',
        ) as StringValue,
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        role: user.role,
        employeeLevel: user.employeeLevel,
        isOnProbation: user.isOnProbation,
        workplaceRole: user.workplaceRole,
        trainingAccess,
        restaurant: user.restaurant,
        managedRestaurants: (user.managedRestaurants ?? []).map((entry) => ({
          ...entry.restaurant,
        })),
      },
    };
  }

  async validateUserById(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('EMAIL_VERIFICATION_REQUIRED');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException(
        user.role === Role.MANAGER || user.role === Role.REGIONAL_MANAGER
          ? 'ACCOUNT_PENDING_ADMIN_APPROVAL'
          : 'ACCOUNT_PENDING_APPROVAL',
      );
    }

    const trainingAccess =
      await this.usersTrainingAccessService.getTrainingAccessByLevel(
        user.employeeLevel,
        user.role,
      );

    return {
      ...user,
      managedRestaurants: (user.managedRestaurants ?? []).map((entry) => ({
        ...entry.restaurant,
      })),
      trainingAccess,
    };
  }

  private hashResetToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private hashEmailVerificationToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private async createEmailVerificationToken(userId: number) {
    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashEmailVerificationToken(plainToken);
    const expiresAt = new Date(
      Date.now() + this.emailVerificationTokenLifetimeHours * 60 * 60 * 1000,
    );

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return plainToken;
  }
}
