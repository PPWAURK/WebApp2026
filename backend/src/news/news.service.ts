import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeLevel, NewsAudience, Role, UploadSection, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isSectionInModule, isUploadSection } from '../uploads/upload-taxonomy';

type RequestLike = {
  protocol: string;
  get: (name: string) => string | undefined;
};

@Injectable()
export class NewsService {
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;

  constructor(private readonly prisma: PrismaService) {}

  async createNewsPost(
    req: RequestLike,
    input: {
      title: string;
      message: string;
      audience?: string;
      module?: string;
      section?: string;
      attachmentDocumentId?: number;
      createdByUserId: number;
    },
  ) {
    const title = input.title.trim();
    const message = input.message.trim();

    if (!title) {
      throw new BadRequestException('title is required');
    }

    if (!message) {
      throw new BadRequestException('message is required');
    }

    const audience = this.parseAudience(input.audience);
    const module = this.parseUploadModule(input.module);
    const section = this.parseUploadSection(input.section);

    if (section && !module) {
      throw new BadRequestException('module is required when section is provided');
    }

    if (module && section && !isSectionInModule(module, section)) {
      throw new BadRequestException('Section does not belong to selected module');
    }

    let attachmentDocumentId: number | null = null;
    if (input.attachmentDocumentId !== undefined) {
      if (!Number.isInteger(input.attachmentDocumentId) || input.attachmentDocumentId <= 0) {
        throw new BadRequestException('attachmentDocumentId must be a positive integer');
      }

      const foundDocument = await this.prisma.document.findUnique({
        where: {
          id: input.attachmentDocumentId,
        },
      });

      if (!foundDocument) {
        throw new NotFoundException('attachment document not found');
      }

      attachmentDocumentId = foundDocument.id;
    }

    const created = await this.prisma.newsPost.create({
      data: {
        title,
        message,
        audience,
        module: module ?? null,
        section: section ?? null,
        attachmentDocumentId,
        createdByUserId: input.createdByUserId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachmentDocument: true,
      },
    });

    return {
      id: created.id,
      title: created.title,
      message: created.message,
      audience: created.audience,
      module: created.module,
      section: created.section,
      createdAt: created.createdAt,
      isRead: false,
      createdBy: created.createdByUser,
      attachment: created.attachmentDocument
        ? {
            documentId: created.attachmentDocument.id,
            originalName: created.attachmentDocument.originalName,
            mimeType: created.attachmentDocument.mimeType,
            mediaType: created.attachmentDocument.mediaType,
            fileUrl: this.buildFileUrl(
              req,
              created.attachmentDocument.category,
              created.attachmentDocument.fileName,
            ),
          }
        : null,
    };
  }

  async listNewsPosts(
    req: RequestLike,
    context: {
      userId: number;
      role: string;
      trainingAccess?: string[];
      limit?: number;
      month?: string;
    },
  ) {
    const limit =
      context.limit && Number.isInteger(context.limit)
        ? Math.max(1, Math.min(50, context.limit))
        : 20;

    const where: Prisma.NewsPostWhereInput = {};

    if (context.role === 'MANAGER') {
      where.audience = {
        in: [NewsAudience.ALL, NewsAudience.MANAGERS],
      };
    }

    if (context.role === 'EMPLOYEE') {
      where.audience = {
        in: [NewsAudience.ALL, NewsAudience.EMPLOYEES],
      };
    }

    if (context.role !== 'ADMIN') {
      const allowedSections = (context.trainingAccess ?? []).filter((section) =>
        isUploadSection(section),
      ) as UploadSection[];

      where.AND = [
        {
          OR: [
            { section: null },
            ...(allowedSections.length > 0 ? [{ section: { in: allowedSections } }] : []),
          ],
        },
      ];
    }

    const monthRange = this.parseMonthRange(context.month);

    const whereWithMonth: Prisma.NewsPostWhereInput = {
      ...where,
      ...(monthRange
        ? {
            createdAt: {
              gte: monthRange.start,
              lt: monthRange.end,
            },
          }
        : {}),
    };

    const rows = await this.prisma.newsPost.findMany({
      where: whereWithMonth,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachmentDocument: true,
        reads: {
          where: {
            userId: context.userId,
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    const monthRows = await this.prisma.newsPost.findMany({
      where,
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const availableMonths = Array.from(
      new Set(
        monthRows.map((entry) => {
          const year = entry.createdAt.getUTCFullYear();
          const month = `${entry.createdAt.getUTCMonth() + 1}`.padStart(2, '0');
          return `${year}-${month}`;
        }),
      ),
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        audience: row.audience,
        module: row.module,
        section: row.section,
        createdAt: row.createdAt,
        isRead: row.reads.length > 0,
        createdBy: row.createdByUser,
        attachment: row.attachmentDocument
          ? {
              documentId: row.attachmentDocument.id,
              originalName: row.attachmentDocument.originalName,
              mimeType: row.attachmentDocument.mimeType,
              mediaType: row.attachmentDocument.mediaType,
              fileUrl: this.buildFileUrl(
                req,
                row.attachmentDocument.category,
                row.attachmentDocument.fileName,
              ),
            }
          : null,
      })),
      availableMonths,
    };
  }

  async deleteNewsPost(newsPostId: number) {
    const existing = await this.prisma.newsPost.findUnique({
      where: {
        id: newsPostId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('News post not found');
    }

    await this.prisma.newsPost.delete({
      where: {
        id: newsPostId,
      },
    });

    return { success: true };
  }

  async markNewsAsRead(
    newsPostId: number,
    userId: number,
    context: {
      role: string;
      trainingAccess?: string[];
    },
  ) {
    const post = await this.prisma.newsPost.findUnique({
      where: {
        id: newsPostId,
      },
      select: {
        id: true,
        audience: true,
        section: true,
      },
    });

    if (!post) {
      throw new NotFoundException('News post not found');
    }

    this.ensureCanReadPost(post, context);

    await this.prisma.newsPostRead.upsert({
      where: {
        newsPostId_userId: {
          newsPostId,
          userId,
        },
      },
      create: {
        newsPostId,
        userId,
      },
      update: {
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async getNewsReadTracking(newsPostId: number) {
    const post = await this.prisma.newsPost.findUnique({
      where: {
        id: newsPostId,
      },
      select: {
        id: true,
        audience: true,
        section: true,
      },
    });

    if (!post) {
      throw new NotFoundException('News post not found');
    }

    const targetRoles = this.getAudienceRoles(post.audience);

    const targetUsers = await this.prisma.user.findMany({
      where: {
        isApproved: true,
        role: {
          in: targetRoles,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeLevel: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: [
        {
          restaurantId: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    const usersInAudience = await this.filterUsersBySectionAccess(targetUsers, post.section);

    const reads = await this.prisma.newsPostRead.findMany({
      where: {
        newsPostId,
        userId: {
          in: usersInAudience.map((user) => user.id),
        },
      },
      select: {
        userId: true,
        readAt: true,
      },
    });

    const readByUserId = new Map(reads.map((read) => [read.userId, read.readAt]));

    const grouped = new Map<
      number | 'UNASSIGNED',
      {
        restaurant: { id: number; name: string; address: string } | null;
        users: Array<{
          id: number;
          name: string | null;
          email: string;
          role: string;
          readAt: Date | null;
        }>;
      }
    >();

    for (const user of usersInAudience) {
      const key = user.restaurant?.id ?? 'UNASSIGNED';
      if (!grouped.has(key)) {
        grouped.set(key, {
          restaurant: user.restaurant
            ? {
                id: user.restaurant.id,
                name: user.restaurant.name,
                address: user.restaurant.address,
              }
            : null,
          users: [],
        });
      }

      const bucket = grouped.get(key);
      if (!bucket) {
        continue;
      }

      bucket.users.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        readAt: readByUserId.get(user.id) ?? null,
      });
    }

    const byRestaurant = Array.from(grouped.values())
      .map((entry) => {
        const unreadUsers = entry.users
          .filter((user) => !user.readAt)
          .map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }));

        const readUsers = entry.users
          .filter((user) => user.readAt)
          .map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            readAt: user.readAt,
          }));

        return {
          restaurant: entry.restaurant,
          totalUsers: entry.users.length,
          readCount: readUsers.length,
          unreadCount: unreadUsers.length,
          unreadUsers,
          readUsers,
        };
      })
      .sort((left, right) => {
        if (!left.restaurant && !right.restaurant) {
          return 0;
        }

        if (!left.restaurant) {
          return 1;
        }

        if (!right.restaurant) {
          return -1;
        }

        return left.restaurant.name.localeCompare(right.restaurant.name);
      });

    const totalUsers = byRestaurant.reduce((acc, item) => acc + item.totalUsers, 0);
    const readCount = byRestaurant.reduce((acc, item) => acc + item.readCount, 0);

    return {
      newsPostId,
      totalUsers,
      readCount,
      unreadCount: totalUsers - readCount,
      byRestaurant,
    };
  }

  private parseAudience(value: string | undefined): NewsAudience {
    if (!value) {
      return NewsAudience.ALL;
    }

    if (
      value === NewsAudience.ALL ||
      value === NewsAudience.MANAGERS ||
      value === NewsAudience.EMPLOYEES
    ) {
      return value;
    }

    throw new BadRequestException('Invalid audience');
  }

  private getAudienceRoles(audience: NewsAudience): Role[] {
    if (audience === NewsAudience.MANAGERS) {
      return [Role.MANAGER];
    }

    if (audience === NewsAudience.EMPLOYEES) {
      return [Role.EMPLOYEE];
    }

    return [Role.MANAGER, Role.EMPLOYEE];
  }

  private ensureCanReadPost(
    post: {
      audience: NewsAudience;
      section: UploadSection | null;
    },
    context: {
      role: string;
      trainingAccess?: string[];
    },
  ) {
    if (context.role !== 'ADMIN' && context.role !== 'MANAGER' && context.role !== 'EMPLOYEE') {
      throw new ForbiddenException('Unsupported role');
    }

    if (context.role === 'MANAGER') {
      if (post.audience !== NewsAudience.ALL && post.audience !== NewsAudience.MANAGERS) {
        throw new ForbiddenException('Cannot mark this news as read');
      }
    }

    if (context.role === 'EMPLOYEE') {
      if (post.audience !== NewsAudience.ALL && post.audience !== NewsAudience.EMPLOYEES) {
        throw new ForbiddenException('Cannot mark this news as read');
      }
    }

    if (context.role !== 'ADMIN' && post.section) {
      const allowedSections = (context.trainingAccess ?? []).filter((section) =>
        isUploadSection(section),
      ) as UploadSection[];

      if (!allowedSections.includes(post.section)) {
        throw new ForbiddenException('Cannot mark this news as read');
      }
    }
  }

  private async filterUsersBySectionAccess(
    users: Array<{
      id: number;
      name: string | null;
      email: string;
      role: Role;
      employeeLevel: EmployeeLevel;
      restaurant: {
        id: number;
        name: string;
        address: string;
      } | null;
    }>,
    section: UploadSection | null,
  ) {
    if (!section) {
      return users;
    }

    const profiles = await this.prisma.employeeLevelAccessProfile.findMany({
      select: {
        employeeLevel: true,
        sections: true,
      },
    });

    const accessByLevel = new Map<EmployeeLevel, UploadSection[]>(
      profiles.map((profile) => {
        const allowedSections = Array.isArray(profile.sections)
          ? profile.sections.filter(
              (entry): entry is UploadSection =>
                typeof entry === 'string' && isUploadSection(entry),
            )
          : [];

        return [profile.employeeLevel, allowedSections];
      }),
    );

    return users.filter((user) => {
      if (user.role === Role.ADMIN) {
        return true;
      }

      const allowedSections = accessByLevel.get(user.employeeLevel) ?? [];
      return allowedSections.includes(section);
    });
  }

  private parseUploadModule(module: string | undefined) {
    if (!module) {
      return undefined;
    }

    if (
      module === 'TRAINING' ||
      module === 'POLICY' ||
      module === 'MANAGEMENT' ||
      module === 'FORMS'
    ) {
      return module;
    }

    throw new BadRequestException('Invalid module');
  }

  private parseUploadSection(section: string | undefined) {
    if (!section) {
      return undefined;
    }

    if (!isUploadSection(section)) {
      throw new BadRequestException('Invalid section');
    }

    return section;
  }

  private parseMonthRange(month: string | undefined) {
    if (!month) {
      return null;
    }

    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) {
      throw new BadRequestException('Invalid month format. Use YYYY-MM');
    }

    const parsedYear = Number(match[1]);
    const parsedMonth = Number(match[2]);

    if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      throw new BadRequestException('Invalid month value');
    }

    const start = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(parsedYear, parsedMonth, 1, 0, 0, 0));

    return { start, end };
  }

  private buildFileUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    category: 'images' | 'videos' | 'documents',
    fileName: string,
  ) {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/uploads/${category}/${fileName}`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/${category}/${fileName}`;
  }
}
