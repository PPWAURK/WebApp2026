import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, Prisma, Role, WorkplaceRole } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  isUploadSection,
  UPLOAD_SECTION_BY_MODULE,
  type UploadSection,
} from '../uploads/upload-taxonomy';

const TRAINING_QUIZ_LINK_LANGUAGES = ['fr', 'bn'] as const;
type TrainingQuizLinkLanguage = (typeof TRAINING_QUIZ_LINK_LANGUAGES)[number];

function isTrainingQuizLinkLanguage(
  value: string,
): value is TrainingQuizLinkLanguage {
  return (
    TRAINING_QUIZ_LINK_LANGUAGES as ReadonlyArray<string>
  ).includes(value);
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;

  private ensureRoleScope(actor: {
    actorRole: string;
    actorRestaurantId: number | null;
  }) {
    if (actor.actorRole === Role.ADMIN) {
      return;
    }

    if (actor.actorRole !== Role.MANAGER) {
      throw new BadRequestException('Only ADMIN and MANAGER are allowed');
    }

    if (!actor.actorRestaurantId) {
      throw new BadRequestException('Manager must be assigned to a restaurant');
    }
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
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
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async listUsersTrainingAccess(
    restaurantId: number | undefined,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const effectiveRestaurantId =
      actor.actorRole === Role.ADMIN ? restaurantId : actor.actorRestaurantId;

    const users = await this.prisma.user.findMany({
      where: {
        ...(actor.actorRole === Role.ADMIN
          ? {
              role: {
                not: Role.ADMIN,
              },
            }
          : {
              role: {
                not: Role.ADMIN,
              },
            }),
        ...(effectiveRestaurantId
          ? { restaurantId: effectiveRestaurantId }
          : {}),
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        role: true,
        workplaceRole: true,
        employeeLevel: true,
        isApproved: true,
        isOnProbation: true,
        trainingAccess: true,
      },
    });

    const levelAccessMap = await this.getTrainingAccessMapByLevel();

    return users.map((user) => ({
      ...user,
      trainingAccess: levelAccessMap.get(user.employeeLevel) ?? [],
    }));
  }

  async listTrainingAccessByLevel(actorRole: string) {
    if (actorRole !== Role.ADMIN) {
      throw new BadRequestException(
        'Only ADMIN can manage level access profiles',
      );
    }

    const profiles = await this.prisma.employeeLevelAccessProfile.findMany({
      orderBy: {
        employeeLevel: 'asc',
      },
      select: {
        employeeLevel: true,
        sections: true,
      },
    });

    return profiles.map((profile) => ({
      employeeLevel: profile.employeeLevel,
      sections: this.normalizeTrainingAccess(profile.sections),
    }));
  }

  async updateTrainingAccessByLevel(
    level: EmployeeLevel,
    sections: string[] | undefined,
    actor: {
      actorRole: string;
    },
  ) {
    if (actor.actorRole !== Role.ADMIN) {
      throw new BadRequestException(
        'Only ADMIN can manage level access profiles',
      );
    }

    if (!sections) {
      throw new BadRequestException('sections is required');
    }

    const uniqueSections = Array.from(new Set(sections));
    if (!uniqueSections.every((section) => isUploadSection(section))) {
      throw new BadRequestException('Invalid training section');
    }

    const updated = await this.prisma.employeeLevelAccessProfile.upsert({
      where: {
        employeeLevel: level,
      },
      create: {
        employeeLevel: level,
        sections: uniqueSections,
      },
      update: {
        sections: uniqueSections,
      },
      select: {
        employeeLevel: true,
        sections: true,
      },
    });

    return {
      employeeLevel: updated.employeeLevel,
      sections: this.normalizeTrainingAccess(updated.sections),
    };
  }

  async listTrainingQuizLinks() {
    const savedLinks = await this.prisma.trainingQuizLink.findMany({
      select: {
        section: true,
        language: true,
        quizUrl: true,
      },
    });

    const savedLinkMap = new Map(
      savedLinks.map((entry) => [
        `${entry.section}:${entry.language.toLowerCase()}`,
        entry.quizUrl,
      ]),
    );

    return this.getAllTrainingSections().flatMap((section) =>
      TRAINING_QUIZ_LINK_LANGUAGES.map((language) => ({
        section,
        language,
        quizUrl: savedLinkMap.get(`${section}:${language}`) ?? null,
      })),
    );
  }

  async upsertTrainingQuizLink(
    sectionRaw: string,
    languageRaw: string,
    quizUrlRaw: string | undefined | null,
    actorRole: string,
  ) {
    if (actorRole !== Role.ADMIN) {
      throw new BadRequestException('Only ADMIN can manage quiz links');
    }

    if (!isUploadSection(sectionRaw)) {
      throw new BadRequestException('Invalid training section');
    }

    const language = languageRaw.toLowerCase();
    if (!isTrainingQuizLinkLanguage(language)) {
      throw new BadRequestException('Invalid quiz link language');
    }

    const normalizedQuizUrl = this.normalizeQuizUrl(quizUrlRaw);

    if (!normalizedQuizUrl) {
      await this.prisma.trainingQuizLink.deleteMany({
        where: {
          section: sectionRaw,
          language,
        },
      });

      return {
        section: sectionRaw,
        language,
        quizUrl: null,
      };
    }

    const updated = await this.prisma.trainingQuizLink.upsert({
      where: {
        section_language: {
          section: sectionRaw,
          language,
        },
      },
      create: {
        section: sectionRaw,
        language,
        quizUrl: normalizedQuizUrl,
      },
      update: {
        quizUrl: normalizedQuizUrl,
      },
      select: {
        section: true,
        language: true,
        quizUrl: true,
      },
    });

    return {
      section: updated.section,
      language,
      quizUrl: updated.quizUrl,
    };
  }

  async updateTrainingAccess(
    userId: number,
    sections: string[] | undefined,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot update ADMIN training access');
    }

    if (actor.actorRole === Role.MANAGER && user.role !== Role.EMPLOYEE) {
      throw new BadRequestException(
        'Manager can only update EMPLOYEE training access',
      );
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only update users in own restaurant',
      );
    }

    if (!sections) {
      throw new BadRequestException('sections is required');
    }

    const uniqueSections = Array.from(new Set(sections));
    if (!uniqueSections.every((section) => isUploadSection(section))) {
      throw new BadRequestException('Invalid training section');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        trainingAccess: uniqueSections,
      },
      select: {
        id: true,
        email: true,
        name: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        role: true,
        employeeLevel: true,
        isApproved: true,
        isOnProbation: true,
        trainingAccess: true,
      },
    });

    return {
      ...updatedUser,
      trainingAccess: this.normalizeTrainingAccess(updatedUser.trainingAccess),
    };
  }

  createEmployee(params: {
    email: string;
    passwordHash: string;
    name?: string;
    restaurantId: number;
    isApproved?: boolean;
    preferredLanguage?: 'fr' | 'zh';
  }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
        restaurantId: params.restaurantId,
        role: Role.EMPLOYEE,
        employeeLevel: EmployeeLevel.L0_PROBATION,
        isApproved: params.isApproved ?? true,
        isOnProbation: true,
        preferredLanguage: params.preferredLanguage ?? 'fr',
        workplaceRole: WorkplaceRole.BOTH,
        trainingAccess: [],
      },
    });
  }

  normalizeTrainingAccess(value: Prisma.JsonValue | null): UploadSection[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const valid = value.filter(
      (entry): entry is string =>
        typeof entry === 'string' && isUploadSection(entry),
    );
    return valid as UploadSection[];
  }

  private getAllTrainingSections(): UploadSection[] {
    return Object.values(UPLOAD_SECTION_BY_MODULE).flat();
  }

  async getTrainingAccessByLevel(
    level: EmployeeLevel,
    role?: string,
  ): Promise<UploadSection[]> {
    if (role === Role.ADMIN) {
      return this.getAllTrainingSections();
    }

    const profile = await this.prisma.employeeLevelAccessProfile.findUnique({
      where: {
        employeeLevel: level,
      },
      select: {
        sections: true,
      },
    });

    return this.normalizeTrainingAccess(profile?.sections ?? null);
  }

  private async getTrainingAccessMapByLevel() {
    const profiles = await this.prisma.employeeLevelAccessProfile.findMany({
      select: {
        employeeLevel: true,
        sections: true,
      },
    });

    return new Map(
      profiles.map((profile) => [
        profile.employeeLevel,
        this.normalizeTrainingAccess(profile.sections),
      ]),
    );
  }

  listUnassignedEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
        restaurantId: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async assignUserRestaurant(userId: number, restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException(
        'Cannot assign restaurant to ADMIN via this endpoint',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        restaurantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });
  }

  async updateManagerRole(
    userId: number,
    params: {
      isManager: boolean;
      restaurantId?: number;
      actorId: number;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot change ADMIN role here');
    }

    if (params.actorId === userId) {
      throw new BadRequestException(
        'Admin cannot edit own role in this endpoint',
      );
    }

    const nextRestaurantId = params.restaurantId ?? user.restaurantId;

    if (params.isManager && !nextRestaurantId) {
      throw new BadRequestException('Manager must be assigned to a restaurant');
    }

    if (nextRestaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: nextRestaurantId },
        select: { id: true },
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: params.isManager ? Role.MANAGER : Role.EMPLOYEE,
        ...(params.restaurantId ? { restaurantId: params.restaurantId } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeLevel: true,
        restaurantId: true,
        isApproved: true,
        isOnProbation: true,
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

    return {
      ...updatedUser,
      trainingAccess: this.normalizeTrainingAccess(updatedUser.trainingAccess),
    };
  }

  async confirmEmployeeProbation(
    userId: number,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isOnProbation: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Only EMPLOYEE probation can be confirmed');
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only update users in own restaurant',
      );
    }

    if (!user.isOnProbation) {
      return {
        id: user.id,
        role: Role.EMPLOYEE,
        employeeLevel: EmployeeLevel.L1_PARTNER,
        isOnProbation: false,
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: Role.EMPLOYEE,
        employeeLevel: EmployeeLevel.L1_PARTNER,
        isOnProbation: false,
      },
      select: {
        id: true,
        role: true,
        employeeLevel: true,
        isOnProbation: true,
      },
    });

    return updated;
  }

  async approveEmployeeAccount(
    userId: number,
    actor: {
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isApproved: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Only EMPLOYEE accounts can be approved');
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only approve users in own restaurant',
      );
    }

    if (user.isApproved) {
      return { id: user.id, isApproved: true };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferredLanguage: true,
        isApproved: true,
      },
    });

    try {
      await this.mailService.sendAccountApprovedEmail({
        email: updated.email,
        recipientName: updated.name,
        language: updated.preferredLanguage === 'zh' ? 'zh' : 'fr',
      });
    } catch {
      // Approval must not fail when mail provider is unavailable.
    }

    return {
      id: updated.id,
      isApproved: updated.isApproved,
    };
  }

  async updateEmployeeLevel(
    userId: number,
    level: EmployeeLevel,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot update ADMIN level');
    }

    if (actor.actorRole === Role.MANAGER && actor.actorId === userId) {
      throw new BadRequestException('Manager cannot update own level');
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only update users in own restaurant',
      );
    }

    const nextRole = this.deriveRoleFromLevel(level);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        employeeLevel: level,
        role: nextRole,
        isOnProbation: level === EmployeeLevel.L0_PROBATION,
      },
      select: {
        id: true,
        role: true,
        employeeLevel: true,
        isOnProbation: true,
      },
    });
  }

  async updateEmployeeWorkplaceRole(
    userId: number,
    workplaceRole: WorkplaceRole,
    actor: {
      actorId: number;
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException(
        'Only EMPLOYEE workplace role can be updated',
      );
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only update users in own restaurant',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        workplaceRole,
      },
      select: {
        id: true,
        workplaceRole: true,
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

  async deleteEmployeeAccount(
    userId: number,
    actor: {
      actorRole: string;
      actorRestaurantId: number | null;
    },
  ) {
    this.ensureRoleScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Only EMPLOYEE accounts can be deleted');
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only delete users in own restaurant',
      );
    }

    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'User cannot be deleted because it is linked to existing records',
        );
      }

      throw error;
    }

    return { success: true, id: userId };
  }

  async updateOwnProfilePhoto(
    userId: number,
    file: Express.Multer.File,
    req: { protocol: string; get: (name: string) => string | undefined },
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const profilePhoto = this.buildProfilePhotoUrl(req, file.filename);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto,
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

    return {
      ...updated,
      trainingAccess: this.normalizeTrainingAccess(updated.trainingAccess),
    };
  }

  async updateOwnProfile(userId: number, payload: { name: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: payload.name,
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

    return {
      ...updated,
      trainingAccess: this.normalizeTrainingAccess(updated.trainingAccess),
    };
  }

  private buildProfilePhotoUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    fileName: string,
  ) {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/uploads/images/${fileName}`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/images/${fileName}`;
  }

  private deriveRoleFromLevel(level: EmployeeLevel) {
    if (
      level === EmployeeLevel.L6_PM ||
      level === EmployeeLevel.L6_MA ||
      level === EmployeeLevel.L7_PDI ||
      level === EmployeeLevel.L7_D
    ) {
      return Role.MANAGER;
    }

    return Role.EMPLOYEE;
  }

  private normalizeQuizUrl(value: string | undefined | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('INVALID_PROTOCOL');
      }
      return parsed.toString();
    } catch {
      throw new BadRequestException('quizUrl must be a valid URL');
    }
  }
}
