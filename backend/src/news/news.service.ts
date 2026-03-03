import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsAudience, UploadSection, type Prisma } from '@prisma/client';
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

    const rows = await this.prisma.newsPost.findMany({
      where,
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

    return rows.map((row) => ({
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
    }));
  }

  async markNewsAsRead(newsPostId: number, userId: number) {
    const post = await this.prisma.newsPost.findUnique({
      where: {
        id: newsPostId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('News post not found');
    }

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
