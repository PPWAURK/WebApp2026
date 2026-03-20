import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, Role, WorkplaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeTrainingAccess } from './users-training-access.utils';
import type { RequestLike } from './users.types';

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
  role: true,
  employeeLevel: true,
  isApproved: true,
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
} as const;

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

  createEmployee(params: {
    email: string;
    passwordHash: string;
    name?: string;
    restaurantId: number;
    role?: Role;
    employeeLevel?: EmployeeLevel;
    isApproved?: boolean;
    preferredLanguage?: 'fr' | 'zh';
  }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
        restaurantId: params.restaurantId,
        role: params.role ?? Role.EMPLOYEE,
        employeeLevel: params.employeeLevel ?? EmployeeLevel.L0_PROBATION,
        isApproved: params.isApproved ?? true,
        isOnProbation: true,
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
  ) {
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

    return {
      ...updated,
      trainingAccess: normalizeTrainingAccess(updated.trainingAccess),
    };
  }

  async updateOwnProfile(userId: number, payload: { name: string }) {
    await this.ensureUserExists(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: payload.name,
      },
      select: MUTABLE_PROFILE_SELECT,
    });

    return {
      ...updated,
      trainingAccess: normalizeTrainingAccess(updated.trainingAccess),
    };
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

  private buildProfilePhotoUrl(req: RequestLike, fileName: string): string {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/uploads/images/${fileName}`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/images/${fileName}`;
  }
}
