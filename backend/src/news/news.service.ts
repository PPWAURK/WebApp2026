import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmployeeLevel,
  NewsAudience,
  Role,
  UploadSection,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isSectionInModule, isUploadSection } from '../uploads/upload-taxonomy';

type RequestLike = {
  protocol: string;
  get: (name: string) => string | undefined;
};

type NewsAccessContext = {
  role: string;
  trainingAccess?: string[];
  employeeLevel?: string;
};

type NewsFeedRow = {
  id: number;
  title: string;
  message: string;
  audience: NewsAudience;
  tags: Prisma.JsonValue | null;
  visibleEmployeeLevels: Prisma.JsonValue | null;
  module: string | null;
  section: UploadSection | null;
  createdAt: Date;
  createdByUser: {
    id: number;
    name: string | null;
    email: string;
  };
  attachmentDocument: {
    id: number;
    category: 'images' | 'videos' | 'documents';
    originalName: string;
    mimeType: string;
    mediaType: 'image' | 'video' | 'document';
    fileName: string;
  } | null;
  reads: Array<{ id: number }>;
};

@Injectable()
export class NewsService {
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
  private readonly maxNewsTags = 10;
  private readonly maxNewsTagLength = 30;

  constructor(private readonly prisma: PrismaService) {}

  async createNewsPost(
    req: RequestLike,
    input: {
      title: string;
      message: string;
      audience?: string;
      tags?: unknown;
      visibleEmployeeLevels?: unknown;
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
    const tags = this.parseTags(input.tags);
    const visibleEmployeeLevels = this.parseVisibleEmployeeLevels(
      input.visibleEmployeeLevels,
    );
    const module = this.parseUploadModule(input.module);
    const section = this.parseUploadSection(input.section);

    if (section && !module) {
      throw new BadRequestException(
        'module is required when section is provided',
      );
    }

    if (module && section && !isSectionInModule(module, section)) {
      throw new BadRequestException(
        'Section does not belong to selected module',
      );
    }

    let attachmentDocumentId: number | null = null;
    if (input.attachmentDocumentId !== undefined) {
      if (
        !Number.isInteger(input.attachmentDocumentId) ||
        input.attachmentDocumentId <= 0
      ) {
        throw new BadRequestException(
          'attachmentDocumentId must be a positive integer',
        );
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
        tags: tags.length > 0 ? tags : undefined,
        visibleEmployeeLevels:
          visibleEmployeeLevels.length > 0 ? visibleEmployeeLevels : undefined,
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
      tags: this.normalizeNewsTags(created.tags),
      visibleEmployeeLevels: this.normalizeVisibleEmployeeLevels(
        created.visibleEmployeeLevels,
      ),
      module: created.module,
      section: created.section,
      createdAt: created.createdAt,
      isRead: false,
      createdBy: created.createdByUser,
      attachment: this.buildAttachmentResponse(req, created.attachmentDocument),
    };
  }

  async listNewsPosts(
    req: RequestLike,
    context: {
      userId: number;
      role: string;
      trainingAccess?: string[];
      employeeLevel?: string;
      limit?: number;
      month?: string;
      tag?: string;
    },
  ) {
    const limit =
      context.limit && Number.isInteger(context.limit)
        ? Math.max(1, Math.min(50, context.limit))
        : 20;

    const monthRange = this.parseMonthRange(context.month);
    const tagFilter = this.parseTagFilter(context.tag);
    const where = this.buildBaseNewsWhere(context);

    const rows = await this.prisma.newsPost.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
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

    const accessibleRows = rows.filter((row) =>
      this.canAccessPost(row, context),
    );

    const availableMonths = Array.from(
      new Set(accessibleRows.map((row) => this.toMonthKey(row.createdAt))),
    );

    const availableTags = Array.from(
      new Set(
        accessibleRows.flatMap((row) => this.normalizeNewsTags(row.tags)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    const filteredRows = accessibleRows
      .filter((row) => {
        if (
          monthRange &&
          (row.createdAt < monthRange.start || row.createdAt >= monthRange.end)
        ) {
          return false;
        }

        if (tagFilter && !this.postHasTag(row.tags, tagFilter)) {
          return false;
        }

        return true;
      })
      .slice(0, limit);

    return {
      items: filteredRows.map((row) => this.buildNewsFeedItem(req, row)),
      availableMonths,
      availableTags,
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
    context: NewsAccessContext,
  ) {
    const post = await this.prisma.newsPost.findUnique({
      where: {
        id: newsPostId,
      },
      select: {
        id: true,
        audience: true,
        section: true,
        visibleEmployeeLevels: true,
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
        visibleEmployeeLevels: true,
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

    const usersInAudience = await this.filterUsersBySectionAccess(
      targetUsers,
      post.section,
    );
    const usersInVisibleLevels = this.filterUsersByVisibleEmployeeLevels(
      usersInAudience,
      this.normalizeVisibleEmployeeLevels(post.visibleEmployeeLevels),
    );

    const reads = await this.prisma.newsPostRead.findMany({
      where: {
        newsPostId,
        userId: {
          in: usersInVisibleLevels.map((user) => user.id),
        },
      },
      select: {
        userId: true,
        readAt: true,
      },
    });

    const readByUserId = new Map(
      reads.map((read) => [read.userId, read.readAt]),
    );

    const grouped = new Map<
      number | 'UNASSIGNED',
      {
        restaurant: { id: number; name: string; address: string } | null;
        users: Array<{
          id: number;
          name: string | null;
          email: string;
          role: string;
          employeeLevel: EmployeeLevel;
          readAt: Date | null;
        }>;
      }
    >();

    for (const user of usersInVisibleLevels) {
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
        employeeLevel: user.employeeLevel,
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
            employeeLevel: user.employeeLevel,
          }));

        const readUsers = entry.users
          .filter((user) => user.readAt)
          .map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeLevel: user.employeeLevel,
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

    const totalUsers = byRestaurant.reduce(
      (accumulator, item) => accumulator + item.totalUsers,
      0,
    );
    const readCount = byRestaurant.reduce(
      (accumulator, item) => accumulator + item.readCount,
      0,
    );

    return {
      newsPostId,
      totalUsers,
      readCount,
      unreadCount: totalUsers - readCount,
      byRestaurant,
    };
  }

  private parseAudience(value: string | undefined): NewsAudience {
    if (
      !value ||
      value === NewsAudience.ALL ||
      value === NewsAudience.MANAGERS ||
      value === NewsAudience.EMPLOYEES
    ) {
      return NewsAudience.ALL;
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
      visibleEmployeeLevels: Prisma.JsonValue | null;
    },
    context: NewsAccessContext,
  ) {
    if (!this.canAccessPost(post, context)) {
      throw new ForbiddenException('Cannot mark this news as read');
    }
  }

  private buildBaseNewsWhere(
    context: NewsAccessContext,
  ): Prisma.NewsPostWhereInput {
    this.ensureSupportedRole(context.role);

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
      const allowedSections = this.normalizeTrainingAccess(
        context.trainingAccess,
      );

      where.AND = [
        {
          OR: [
            { section: null },
            ...(allowedSections.length > 0
              ? [{ section: { in: allowedSections } }]
              : []),
          ],
        },
      ];
    }

    return where;
  }

  private canAccessPost(
    post: {
      audience: NewsAudience;
      section: UploadSection | null;
      visibleEmployeeLevels: Prisma.JsonValue | null;
    },
    context: NewsAccessContext,
  ) {
    this.ensureSupportedRole(context.role);

    if (!this.matchesAudience(post.audience, context.role)) {
      return false;
    }

    if (
      context.role !== 'ADMIN' &&
      post.section &&
      !this.normalizeTrainingAccess(context.trainingAccess).includes(
        post.section,
      )
    ) {
      return false;
    }

    if (context.role === 'ADMIN') {
      return true;
    }

    const visibleEmployeeLevels = this.normalizeVisibleEmployeeLevels(
      post.visibleEmployeeLevels,
    );
    if (visibleEmployeeLevels.length === 0) {
      return true;
    }

    const employeeLevel = this.parseEmployeeLevel(context.employeeLevel);
    return employeeLevel
      ? visibleEmployeeLevels.includes(employeeLevel)
      : false;
  }

  private matchesAudience(audience: NewsAudience, role: string) {
    if (role === 'ADMIN') {
      return true;
    }

    if (role === 'MANAGER') {
      return (
        audience === NewsAudience.ALL || audience === NewsAudience.MANAGERS
      );
    }

    if (role === 'EMPLOYEE') {
      return (
        audience === NewsAudience.ALL || audience === NewsAudience.EMPLOYEES
      );
    }

    return false;
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

  private filterUsersByVisibleEmployeeLevels(
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
    visibleEmployeeLevels: EmployeeLevel[],
  ) {
    if (visibleEmployeeLevels.length === 0) {
      return users;
    }

    return users.filter((user) =>
      visibleEmployeeLevels.includes(user.employeeLevel),
    );
  }

  private buildNewsFeedItem(req: RequestLike, row: NewsFeedRow) {
    return {
      id: row.id,
      title: row.title,
      message: row.message,
      audience: row.audience,
      tags: this.normalizeNewsTags(row.tags),
      visibleEmployeeLevels: this.normalizeVisibleEmployeeLevels(
        row.visibleEmployeeLevels,
      ),
      module: row.module,
      section: row.section,
      createdAt: row.createdAt,
      isRead: row.reads.length > 0,
      createdBy: row.createdByUser,
      attachment: this.buildAttachmentResponse(req, row.attachmentDocument),
    };
  }

  private buildAttachmentResponse(
    req: RequestLike,
    attachmentDocument:
      | {
          id: number;
          category: 'images' | 'videos' | 'documents';
          originalName: string;
          mimeType: string;
          mediaType: 'image' | 'video' | 'document';
          fileName: string;
        }
      | null
      | undefined,
  ) {
    if (!attachmentDocument) {
      return null;
    }

    return {
      documentId: attachmentDocument.id,
      originalName: attachmentDocument.originalName,
      mimeType: attachmentDocument.mimeType,
      mediaType: attachmentDocument.mediaType,
      fileUrl: this.buildFileUrl(
        req,
        attachmentDocument.category,
        attachmentDocument.fileName,
      ),
    };
  }

  private parseTags(value: unknown) {
    if (value === undefined || value === null || value === '') {
      return [] as string[];
    }

    const rawTags = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(/[\n,]/)
        : null;

    if (!rawTags) {
      throw new BadRequestException('tags must be an array of strings');
    }

    const seen = new Set<string>();
    const tags: string[] = [];

    for (const entry of rawTags) {
      if (typeof entry !== 'string') {
        throw new BadRequestException('tags must be an array of strings');
      }

      const normalizedTag = entry
        .trim()
        .replace(/^#+/, '')
        .replace(/\s+/g, ' ');

      if (!normalizedTag) {
        continue;
      }

      if (normalizedTag.length > this.maxNewsTagLength) {
        throw new BadRequestException(
          `each tag must be at most ${this.maxNewsTagLength} characters`,
        );
      }

      const key = this.getTagKey(normalizedTag);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      tags.push(normalizedTag);
    }

    if (tags.length > this.maxNewsTags) {
      throw new BadRequestException(
        `at most ${this.maxNewsTags} tags are allowed`,
      );
    }

    return tags;
  }

  private parseTagFilter(value: string | undefined) {
    if (!value) {
      return null;
    }

    const [tag] = this.parseTags([value]);
    return tag ? this.getTagKey(tag) : null;
  }

  private normalizeNewsTags(value: Prisma.JsonValue | null | undefined) {
    if (!Array.isArray(value)) {
      return [] as string[];
    }

    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  private postHasTag(
    value: Prisma.JsonValue | null | undefined,
    tagFilter: string,
  ) {
    return this.normalizeNewsTags(value).some(
      (tag) => this.getTagKey(tag) === tagFilter,
    );
  }

  private parseVisibleEmployeeLevels(value: unknown) {
    if (value === undefined || value === null) {
      return [] as EmployeeLevel[];
    }

    const rawLevels = Array.isArray(value) ? value : [value];
    const seen = new Set<EmployeeLevel>();
    const levels: EmployeeLevel[] = [];

    for (const entry of rawLevels) {
      if (typeof entry !== 'string') {
        throw new BadRequestException(
          'visibleEmployeeLevels must be an array of employee levels',
        );
      }

      const employeeLevel = this.parseEmployeeLevel(entry);
      if (!employeeLevel) {
        throw new BadRequestException('Invalid employee level');
      }

      if (seen.has(employeeLevel)) {
        continue;
      }

      seen.add(employeeLevel);
      levels.push(employeeLevel);
    }

    return levels;
  }

  private normalizeVisibleEmployeeLevels(
    value: Prisma.JsonValue | null | undefined,
  ) {
    if (!Array.isArray(value)) {
      return [] as EmployeeLevel[];
    }

    return value.filter(
      (entry): entry is EmployeeLevel =>
        typeof entry === 'string' && this.parseEmployeeLevel(entry) !== null,
    );
  }

  private parseEmployeeLevel(value: string | undefined) {
    if (!value) {
      return null;
    }

    return Object.values(EmployeeLevel).includes(value as EmployeeLevel)
      ? (value as EmployeeLevel)
      : null;
  }

  private normalizeTrainingAccess(trainingAccess: string[] | undefined) {
    return (trainingAccess ?? []).filter((section): section is UploadSection =>
      isUploadSection(section),
    );
  }

  private ensureSupportedRole(role: string) {
    if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'EMPLOYEE') {
      throw new ForbiddenException('Unsupported role');
    }
  }

  private getTagKey(value: string) {
    return value.trim().toLocaleLowerCase();
  }

  private toMonthKey(date: Date) {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
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

    if (
      !Number.isInteger(parsedYear) ||
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
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
    const normalizedPrefix = (process.env.API_PREFIX ?? '').replace(
      /^\/+|\/+$/g,
      '',
    );

    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      const normalizedPrefixEscaped = normalizedPrefix.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      const hasPrefixAlready =
        normalizedPrefix.length > 0 &&
        new RegExp(`/${normalizedPrefixEscaped}$`).test(normalizedBaseUrl);

      const baseUrlWithPrefix =
        normalizedPrefix.length > 0 && !hasPrefixAlready
          ? `${normalizedBaseUrl}/${normalizedPrefix}`
          : normalizedBaseUrl;

      return `${baseUrlWithPrefix}/uploads/${category}/${fileName}`;
    }

    const host = req.get('host');
    const prefixedUploadsPath = normalizedPrefix
      ? `/${normalizedPrefix}/uploads/${category}/${fileName}`
      : `/uploads/${category}/${fileName}`;

    return `${req.protocol}://${host}${prefixedUploadsPath}`;
  }
}
