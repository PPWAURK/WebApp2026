import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import {
  canActorManageRestaurant,
  ensureAdminOrManagerScope,
  getActorRestaurantScopeIds,
} from './users-scope';
import {
  ensureAdminRole,
  getAllTrainingSections,
  isTrainingAccessSection,
  isTrainingQuizLinkLanguage,
  normalizeQuizUrl,
  normalizeTrainingAccess,
  type TrainingAccessSection,
  TRAINING_QUIZ_LINK_LANGUAGES,
  validateTrainingSections,
} from './users-training-access.utils';
import type { RoleScopeActorWithId } from './users.types';

@Injectable()
export class UsersTrainingAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async listUsersTrainingAccess(
    restaurantId: number | undefined,
    actor: RoleScopeActorWithId,
  ) {
    ensureAdminOrManagerScope(actor);

    await this.usersService.deleteExpiredPendingEmailVerificationUsers();

    const scopedRestaurantIds = getActorRestaurantScopeIds(actor);

    if (
      actor.actorRole !== Role.ADMIN &&
      restaurantId !== undefined &&
      !scopedRestaurantIds.includes(restaurantId)
    ) {
      throw new BadRequestException(
        'Requested restaurant is outside your scope',
      );
    }

    const users = await this.prisma.user.findMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
        ...(actor.actorRole === Role.ADMIN
          ? restaurantId
            ? { restaurantId }
            : {}
          : {
              restaurantId:
                restaurantId !== undefined
                  ? restaurantId
                  : {
                      in: scopedRestaurantIds,
                    },
            }),
      },
      orderBy: {
        createdAt: 'asc',
      },
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
        workplaceRole: true,
        employeeLevel: true,
        isApproved: true,
        emailVerifiedAt: true,
        isOnProbation: true,
      },
    });

    const levelAccessMap = await this.getTrainingAccessMapByLevel();

    return users.map((user) => {
      const { emailVerifiedAt, ...restUser } = user;

      return {
        ...restUser,
        managedRestaurants: user.managedRestaurants.map((entry) => ({
          ...entry.restaurant,
        })),
        isEmailVerified: emailVerifiedAt !== null,
        trainingAccess: levelAccessMap.get(user.employeeLevel) ?? [],
      };
    });
  }

  async listTrainingAccessByLevel(actorRole: string) {
    ensureAdminRole(actorRole, 'Only ADMIN can manage level access profiles');

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
      sections: normalizeTrainingAccess(profile.sections),
    }));
  }

  async updateTrainingAccessByLevel(
    level: EmployeeLevel,
    sections: string[] | undefined,
    actor: {
      actorRole: string;
    },
  ) {
    ensureAdminRole(
      actor.actorRole,
      'Only ADMIN can manage level access profiles',
    );

    const uniqueSections = validateTrainingSections(sections);

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
      sections: normalizeTrainingAccess(updated.sections),
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

    return getAllTrainingSections().flatMap((section) =>
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
    ensureAdminRole(actorRole, 'Only ADMIN can manage quiz links');

    if (!isTrainingAccessSection(sectionRaw)) {
      throw new BadRequestException('Invalid training section');
    }

    const language = languageRaw.toLowerCase();
    if (!isTrainingQuizLinkLanguage(language)) {
      throw new BadRequestException('Invalid quiz link language');
    }

    const normalizedQuizUrl = normalizeQuizUrl(quizUrlRaw);
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
    actor: RoleScopeActorWithId,
  ) {
    ensureAdminOrManagerScope(actor);

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

    if (actor.actorRole !== Role.ADMIN && user.role !== Role.EMPLOYEE) {
      throw new BadRequestException(
        'Manager can only update EMPLOYEE training access',
      );
    }

    if (
      actor.actorRole !== Role.ADMIN &&
      !canActorManageRestaurant(actor, user.restaurantId)
    ) {
      throw new BadRequestException(
        'Manager can only update users in own restaurant',
      );
    }

    const uniqueSections = validateTrainingSections(sections);

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
        isOnProbation: true,
        trainingAccess: true,
      },
    });

    return {
      ...updatedUser,
      managedRestaurants: updatedUser.managedRestaurants.map((entry) => ({
        ...entry.restaurant,
      })),
      trainingAccess: normalizeTrainingAccess(updatedUser.trainingAccess),
    };
  }

  async getTrainingAccessByLevel(
    level: EmployeeLevel,
    role?: string,
  ): Promise<TrainingAccessSection[]> {
    if (role === Role.ADMIN) {
      return getAllTrainingSections();
    }

    const profile = await this.prisma.employeeLevelAccessProfile.findUnique({
      where: {
        employeeLevel: level,
      },
      select: {
        sections: true,
      },
    });

    return normalizeTrainingAccess(profile?.sections ?? null);
  }

  private async getTrainingAccessMapByLevel(): Promise<
    Map<EmployeeLevel, TrainingAccessSection[]>
  > {
    const profiles = await this.prisma.employeeLevelAccessProfile.findMany({
      select: {
        employeeLevel: true,
        sections: true,
      },
    });

    return new Map(
      profiles.map((profile) => [
        profile.employeeLevel,
        normalizeTrainingAccess(profile.sections),
      ]),
    );
  }
}
