import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, Prisma, Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ensureAdminOrManagerScope } from './users-scope';
import type { RoleScopeActor, RoleScopeActorWithId } from './users.types';

@Injectable()
export class UsersApprovalService {
  private readonly logger = new Logger(UsersApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async confirmEmployeeProbation(userId: number, actor: RoleScopeActorWithId) {
    ensureAdminOrManagerScope(actor);

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

    return this.prisma.user.update({
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
  }

  async approveEmployeeAccount(userId: number, actor: RoleScopeActor) {
    ensureAdminOrManagerScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isApproved: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (actor.actorRole === Role.MANAGER && user.role !== Role.EMPLOYEE) {
      throw new BadRequestException(
        'Manager can only approve EMPLOYEE accounts',
      );
    }

    if (
      actor.actorRole === Role.ADMIN &&
      user.role !== Role.MANAGER &&
      user.role !== Role.EMPLOYEE
    ) {
      throw new BadRequestException(
        'Admin can only approve MANAGER or EMPLOYEE accounts',
      );
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

    if (!user.emailVerifiedAt) {
      throw new BadRequestException(
        'Email must be verified before account review',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        ...(user.role === Role.MANAGER
          ? { employeeLevel: EmployeeLevel.L7_D }
          : {}),
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
    } catch (error) {
      this.logger.warn(
        `Failed to send account approval email for user ${updated.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      id: updated.id,
      isApproved: updated.isApproved,
    };
  }

  async rejectAccountRequest(userId: number, actor: RoleScopeActor) {
    ensureAdminOrManagerScope(actor);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isApproved: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isApproved) {
      throw new BadRequestException('Only pending accounts can be rejected');
    }

    if (!user.emailVerifiedAt) {
      throw new BadRequestException(
        'Email must be verified before account review',
      );
    }

    if (actor.actorRole === Role.MANAGER && user.role !== Role.EMPLOYEE) {
      throw new BadRequestException(
        'Manager can only reject EMPLOYEE accounts',
      );
    }

    if (
      actor.actorRole === Role.ADMIN &&
      user.role !== Role.MANAGER &&
      user.role !== Role.EMPLOYEE
    ) {
      throw new BadRequestException(
        'Admin can only reject MANAGER or EMPLOYEE accounts',
      );
    }

    if (
      actor.actorRole === Role.MANAGER &&
      user.restaurantId !== actor.actorRestaurantId
    ) {
      throw new BadRequestException(
        'Manager can only reject users in own restaurant',
      );
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      id: user.id,
      success: true,
    };
  }

  async deleteEmployeeAccount(userId: number, actor: RoleScopeActor) {
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
      throw new BadRequestException('ADMIN accounts cannot be deleted');
    }

    if (actor.actorRole === Role.MANAGER && user.role !== Role.EMPLOYEE) {
      throw new BadRequestException(
        'Manager can only delete EMPLOYEE accounts',
      );
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
}
