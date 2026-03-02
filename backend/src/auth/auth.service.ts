import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly restaurantsService: RestaurantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private readonly resetTokenLifetimeMinutes = 30;

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

    if (!user.isApproved) {
      throw new UnauthorizedException('ACCOUNT_PENDING_APPROVAL');
    }

    const authenticatedUser = await this.usersService.findById(user.id);

    if (!authenticatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(authenticatedUser);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('EMAIL_ALREADY_REGISTERED');
    }

    await this.restaurantsService.ensureRestaurantExists(registerDto.restaurantId);

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const createdUser = await this.usersService.createEmployee({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      restaurantId: registerDto.restaurantId,
      isApproved: false,
    });

    return {
      pendingApproval: true,
      userId: createdUser.id,
      message: 'ACCOUNT_PENDING_APPROVAL',
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

    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(plainToken);
    const expiresAt = new Date(Date.now() + this.resetTokenLifetimeMinutes * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    try {
      await this.mailService.sendForgotPasswordEmail({
        email: user.email,
        recipientName: user.name,
        resetToken: plainToken,
      });
    } catch {
      // Keep API response stable to avoid leaking account state.
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
    isOnProbation: boolean;
    workplaceRole: string;
    trainingAccess: Prisma.JsonValue | null;
    restaurantId: number | null;
    restaurant: { id: number; name: string; address: string } | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      workplaceRole: user.workplaceRole,
    };

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
        isOnProbation: user.isOnProbation,
        workplaceRole: user.workplaceRole,
        trainingAccess: this.usersService.normalizeTrainingAccess(
          user.trainingAccess,
        ),
        restaurant: user.restaurant,
      },
    };
  }

  async validateUserById(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException('ACCOUNT_PENDING_APPROVAL');
    }

    return {
      ...user,
      trainingAccess: this.usersService.normalizeTrainingAccess(user.trainingAccess),
    };
  }

  private hashResetToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
