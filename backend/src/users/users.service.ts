import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, Prisma, Role, WorkplaceRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS } from '../auth/auth.constants';
import { normalizeTrainingAccess } from './users-training-access.utils';
import type { RequestLike } from './users.types';

const EXPIRED_PENDING_EMAIL_VERIFICATION_WINDOW_MS =
  EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS * 60 * 60 * 1000;

const USER_DETAILS_SELECT = {
  id: true,
  email: true,
  name: true,
  profilePhoto: true,
  restaurantId: true,
  restaurant: {
    select: {
      id: true,
      name: true,
      address: true,
    },
  },
  managedRestaurants: {
    select: {
      restaurant: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  },
  role: true,
  employeeLevel: true,
  isApproved: true,
  emailVerifiedAt: true,
  isOnProbation: true,
  workplaceRole: true,
  trainingAccess: true,
  createdAt: true,
  updatedAt: true,
} as const;

const MUTABLE_PROFILE_SELECT = {
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
  managedRestaurants: {
    select: {
      restaurant: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  },
} as const;

type MutableProfileRecord = Prisma.UserGetPayload<{
  select: typeof MUTABLE_PROFILE_SELECT;
}>;

type MutableProfileResponse = Omit<
  MutableProfileRecord,
  'managedRestaurants' | 'trainingAccess'
> & {
  managedRestaurants: Array<{
    id: number;
    name: string;
    address: string;
  }>;
  trainingAccess: ReturnType<typeof normalizeTrainingAccess>;
};

@Injectable()
export class UsersService {
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;

  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_DETAILS_SELECT,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async deleteExpiredPendingEmailVerificationUsers(params?: {
    email?: string;
    now?: Date;
  }) {
    const now = params?.now ?? new Date();
    const expiredBefore = new Date(
      now.getTime() - EXPIRED_PENDING_EMAIL_VERIFICATION_WINDOW_MS,
    );

    const result = await this.prisma.user.deleteMany({
      where: {
        isApproved: false,
        emailVerifiedAt: null,
        createdAt: {
          lte: expiredBefore,
        },
        ...(params?.email ? { email: params.email } : {}),
      },
    });

    return result.count;
  }

  createEmployee(params: {
    email: string;
    passwordHash: string;
    name?: string;
    restaurantId: number;
    role?: Role;
    employeeLevel?: EmployeeLevel;
    isApproved?: boolean;
    emailVerifiedAt?: Date | null;
    preferredLanguage?: 'fr' | 'zh';
  }) {
    const employeeLevel = params.employeeLevel ?? EmployeeLevel.L0_PROBATION;

    return this.prisma.user.create({
      data: {
        email: params.email.trim().toLowerCase(),
        passwordHash: params.passwordHash,
        name: params.name,
        restaurantId: params.restaurantId,
        role: params.role ?? Role.EMPLOYEE,
        employeeLevel,
        isApproved: params.isApproved ?? true,
        emailVerifiedAt: params.emailVerifiedAt,
        isOnProbation: employeeLevel === EmployeeLevel.L0_PROBATION,
        preferredLanguage: params.preferredLanguage ?? 'fr',
        workplaceRole: WorkplaceRole.BOTH,
        trainingAccess: [],
      },
    });
  }

  async updatePreferredLanguage(userId: number, language: 'fr' | 'zh') {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferredLanguage: language,
      },
      select: {
        id: true,
      },
    });
  }

  async updateOwnProfilePhoto(
    userId: number,
    file: Express.Multer.File,
    req: RequestLike,
  ): Promise<MutableProfileResponse> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    await this.ensureUserExists(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: this.buildProfilePhotoUrl(req, file.filename),
      },
      select: MUTABLE_PROFILE_SELECT,
    });

    return this.formatMutableProfile(updated);
  }

  async updateOwnProfile(
    userId: number,
    payload: { name: string },
  ): Promise<MutableProfileResponse> {
    await this.ensureUserExists(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: payload.name,
      },
      select: MUTABLE_PROFILE_SELECT,
    });

    return this.formatMutableProfile(updated);
  }

  async updateOwnEmail(
    userId: number,
    payload: { email: string; currentPassword: string },
  ): Promise<MutableProfileResponse> {
    const user = await this.getCredentialUpdateTarget(userId);
    const normalizedEmail = payload.email.trim().toLowerCase();

    const isCurrentPasswordValid = await bcrypt.compare(
      payload.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('CURRENT_PASSWORD_INCORRECT');
    }

    if (normalizedEmail === user.email) {
      const currentProfile = await this.getMutableProfile(userId);
      return this.formatMutableProfile(currentProfile);
    }

    const existingEmailOwner = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    if (existingEmailOwner && existingEmailOwner.id !== userId) {
      throw new ConflictException('EMAIL_ALREADY_REGISTERED');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
      },
      select: MUTABLE_PROFILE_SELECT,
    });

    return this.formatMutableProfile(updated);
  }

  async updateOwnPassword(
    userId: number,
    payload: { currentPassword: string; newPassword: string },
  ): Promise<{ success: true }> {
    const user = await this.getCredentialUpdateTarget(userId);
    const isCurrentPasswordValid = await bcrypt.compare(
      payload.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('CURRENT_PASSWORD_INCORRECT');
    }

    const isSamePassword = await bcrypt.compare(
      payload.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException('NEW_PASSWORD_MUST_BE_DIFFERENT');
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
      select: {
        id: true,
      },
    });

    return { success: true };
  }

  private async ensureUserExists(userId: number): Promise<void> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }
  }

  private async getCredentialUpdateTarget(userId: number): Promise<{
    id: number;
    email: string;
    passwordHash: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      email: user.email.trim().toLowerCase(),
    };
  }

  private async getMutableProfile(
    userId: number,
  ): Promise<MutableProfileRecord> {
    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: MUTABLE_PROFILE_SELECT,
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return profile;
  }

  private formatMutableProfile(
    profile: MutableProfileRecord,
  ): MutableProfileResponse {
    return {
      ...profile,
      managedRestaurants: (profile.managedRestaurants ?? []).map((entry) => ({
        ...entry.restaurant,
      })),
      trainingAccess: normalizeTrainingAccess(profile.trainingAccess),
    };
  }

  private buildProfilePhotoUrl(req: RequestLike, fileName: string): string {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/uploads/images/${fileName}`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/images/${fileName}`;
  }
}
