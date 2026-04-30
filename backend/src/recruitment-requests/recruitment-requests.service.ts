import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RecruitmentRequestStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRecruitmentRequestDto } from './dto/create-recruitment-request.dto';
import type {
  RecruitmentRequestActor,
  RecruitmentRequestSummary,
} from './recruitment-requests.types';

export const recruitmentRequestSelect = {
  id: true,
  restaurant: {
    select: {
      id: true,
      name: true,
      address: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  position: true,
  contractType: true,
  headcount: true,
  notes: true,
  status: true,
  processedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  processedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RecruitmentRequestSelect;

type RecruitmentRequestRow = Prisma.RecruitmentRequestGetPayload<{
  select: typeof recruitmentRequestSelect;
}>;

@Injectable()
export class RecruitmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecruitmentRequest(
    actor: RecruitmentRequestActor,
    body: CreateRecruitmentRequestDto,
  ): Promise<RecruitmentRequestSummary> {
    const restaurantId = this.resolveSubmissionRestaurantId(actor, body);
    const payload = this.normalizeCreatePayload(body);

    await this.ensureRestaurantExists(restaurantId);

    const created = await this.prisma.recruitmentRequest.create({
      data: {
        ...payload,
        restaurantId,
        createdByUserId: actor.id,
      },
      select: recruitmentRequestSelect,
    });

    return this.buildRecruitmentRequestSummary(created);
  }

  async listRecruitmentRequests(
    actor: RecruitmentRequestActor,
    status?: RecruitmentRequestStatus,
  ): Promise<RecruitmentRequestSummary[]> {
    this.ensureAdmin(actor);

    const requests = await this.prisma.recruitmentRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      select: recruitmentRequestSelect,
    });

    return requests.map((request) =>
      this.buildRecruitmentRequestSummary(request),
    );
  }

  async updateRecruitmentRequestStatus(
    actor: RecruitmentRequestActor,
    requestId: number,
    status: RecruitmentRequestStatus,
  ): Promise<RecruitmentRequestSummary> {
    this.ensureAdmin(actor);

    try {
      const updated = await this.prisma.recruitmentRequest.update({
        where: { id: requestId },
        data:
          status === RecruitmentRequestStatus.PROCESSED
            ? {
                status,
                processedByUserId: actor.id,
                processedAt: new Date(),
              }
            : {
                status,
                processedByUserId: null,
                processedAt: null,
              },
        select: recruitmentRequestSelect,
      });

      return this.buildRecruitmentRequestSummary(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Recruitment request not found');
      }

      throw error;
    }
  }

  private resolveSubmissionRestaurantId(
    actor: RecruitmentRequestActor,
    body: Pick<CreateRecruitmentRequestDto, 'restaurantId'>,
  ): number {
    if (actor.role === Role.MANAGER) {
      if (!actor.restaurantId) {
        throw new BadRequestException(
          'Manager must be assigned to a restaurant',
        );
      }

      return actor.restaurantId;
    }

    if (actor.role === Role.REGIONAL_MANAGER) {
      if (!body.restaurantId) {
        throw new BadRequestException('restaurantId is required');
      }

      if (!actor.managedRestaurantIds.includes(body.restaurantId)) {
        throw new ForbiddenException('Restaurant is outside your scope');
      }

      return body.restaurantId;
    }

    throw new ForbiddenException('Manager role required');
  }

  private normalizeCreatePayload(body: CreateRecruitmentRequestDto): {
    position: string;
    contractType: CreateRecruitmentRequestDto['contractType'];
    headcount: number;
    notes: string | null;
  } {
    const position = body.position.trim();
    const notes = body.notes?.trim() ?? '';

    if (!position) {
      throw new BadRequestException('position is required');
    }

    return {
      position,
      contractType: body.contractType,
      headcount: body.headcount,
      notes: notes || null,
    };
  }

  private async ensureRestaurantExists(restaurantId: number): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
  }

  private ensureAdmin(actor: RecruitmentRequestActor): void {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin only');
    }
  }

  private buildRecruitmentRequestSummary(
    row: RecruitmentRequestRow,
  ): RecruitmentRequestSummary {
    return {
      id: row.id,
      restaurant: row.restaurant,
      createdBy: row.createdByUser,
      position: row.position,
      contractType: row.contractType,
      headcount: row.headcount,
      notes: row.notes ?? '',
      status: row.status,
      processedBy: row.processedByUser,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
