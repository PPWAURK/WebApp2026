import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UploadCategory,
  UploadMediaType,
  UploadModule,
  UploadSection,
  type Prisma,
} from '@prisma/client';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { basename, extname, isAbsolute, join, resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  isSectionInModule,
  isUploadModule,
  isUploadSection,
  UPLOAD_SECTION_BY_MODULE,
} from './upload-taxonomy';

@Injectable()
export class UploadsService {
  private readonly fallbackMimeTypesByExtension: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };
  private readonly storageRoot = this.resolveStorageRoot(
    process.env.STORAGE_ROOT_PATH,
  );
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
  private readonly storageDirs: Record<UploadCategory, string> = {
    [UploadCategory.images]: join(this.storageRoot, 'images'),
    [UploadCategory.videos]: join(this.storageRoot, 'videos'),
    [UploadCategory.documents]: join(this.storageRoot, 'documents'),
  };

  constructor(private readonly prisma: PrismaService) {
    this.ensureStorageFolders();
  }

  async handleSingleUpload(
    file: Express.Multer.File,
    req: { protocol: string; get: (name: string) => string | undefined },
    metadataInput: {
      module?: string;
      section?: string;
      customCategory?: string;
      uploadedByUserId?: number;
    },
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const module = this.parseUploadModule(metadataInput.module);
    const resolvedMimeType = this.resolveMimeType(file.mimetype, file.originalname);
    const category = this.getCategoryFromMimeType(resolvedMimeType);
    const mediaType = this.getMediaType(resolvedMimeType);
    const normalizedOriginalName = this.normalizeOriginalName(file.originalname);
    const normalizedCustomCategory = this.normalizeCustomCategory(
      metadataInput.customCategory,
    );

    let section: UploadSection | undefined;

    if (normalizedCustomCategory) {
      const mappedCategory = await this.prisma.moduleCategory.findUnique({
        where: {
          module_name: {
            module,
            name: normalizedCustomCategory,
          },
        },
        select: {
          section: true,
        },
      });

      if (!mappedCategory) {
        throw new BadRequestException('Category not found in selected module');
      }

      section = mappedCategory.section;
    } else if (metadataInput.section) {
      section = this.parseUploadSection(metadataInput.section);
    } else {
      section = UPLOAD_SECTION_BY_MODULE[module][0];
    }

    if (!section || !isSectionInModule(module, section)) {
      throw new BadRequestException('Section does not belong to selected module');
    }

    const createdDocument = await this.prisma.document.create({
      data: {
        fileName: file.filename,
        category,
        originalName: normalizedOriginalName,
        customCategory: normalizedCustomCategory ?? null,
        mimeType: resolvedMimeType,
        size: file.size,
        mediaType,
        module,
        section,
        uploadedByUserId: metadataInput.uploadedByUserId ?? null,
      },
    });

    return {
      documentId: createdDocument.id,
      fileName: createdDocument.fileName,
      category: createdDocument.category,
      originalName: createdDocument.originalName,
      customCategory: createdDocument.customCategory,
      mimeType: createdDocument.mimeType,
      size: createdDocument.size,
      fileUrl: this.buildFileUrl(req, createdDocument.category, createdDocument.fileName),
      mediaType: createdDocument.mediaType,
      module: createdDocument.module,
      section: createdDocument.section,
    };
  }

  async handleMultipleUpload(
    files: Express.Multer.File[],
    req: { protocol: string; get: (name: string) => string | undefined },
    metadataInput: {
      module?: string;
      section?: string;
      customCategory?: string;
      uploadedByUserId?: number;
    },
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    return Promise.all(
      files.map((file) => this.handleSingleUpload(file, req, metadataInput)),
    );
  }

  async listLibrary(
    req: { protocol: string; get: (name: string) => string | undefined },
    filters: {
      module?: string;
      section?: string;
      mediaType?: string;
      customCategory?: string;
    },
    authContext: { role?: string; trainingAccess?: string[] | undefined },
  ) {
    const moduleFilter = filters.module
      ? this.parseUploadModule(filters.module)
      : undefined;
    const sectionFilter = filters.section
      ? this.parseUploadSection(filters.section)
      : undefined;
    const mediaTypeFilter = filters.mediaType
      ? this.parseMediaType(filters.mediaType)
      : undefined;
    const customCategoryFilter = this.normalizeCustomCategory(
      filters.customCategory,
    );

    const where: Prisma.DocumentWhereInput = {
      ...(moduleFilter ? { module: moduleFilter } : {}),
      ...(sectionFilter ? { section: sectionFilter } : {}),
      ...(mediaTypeFilter ? { mediaType: mediaTypeFilter } : {}),
      ...(customCategoryFilter ? { customCategory: customCategoryFilter } : {}),
    };

    if (
      authContext.role !== 'ADMIN' &&
      moduleFilter !== UploadModule.FORMS
    ) {
      const allowedSections = (authContext.trainingAccess ?? []).filter((section) =>
        isUploadSection(section),
      );

      if (!allowedSections.length) {
        return [];
      }

      where.section = {
        in: allowedSections as UploadSection[],
      };
    }

    const entries = await this.prisma.document.findMany({
      where,
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return entries.map((entry) => ({
      documentId: entry.id,
      ...entry,
      fileUrl: this.buildFileUrl(req, entry.category, entry.fileName),
    }));
  }

  async listModuleCategories(moduleRaw: string | undefined) {
    const module = moduleRaw ? this.parseUploadModule(moduleRaw) : undefined;

    return this.prisma.moduleCategory.findMany({
      where: module ? { module } : undefined,
      orderBy: [
        {
          module: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async createModuleCategory(input: {
    module?: string;
    name?: string;
    section?: string;
  }) {
    const module = this.parseUploadModule(input.module);
    const section = this.parseUploadSection(input.section);

    if (!isSectionInModule(module, section)) {
      throw new BadRequestException('Section does not belong to selected module');
    }

    const name = this.normalizeCustomCategory(input.name);
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const existing = await this.prisma.moduleCategory.findUnique({
      where: {
        module_name: {
          module,
          name,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new BadRequestException('Category already exists in selected module');
    }

    return this.prisma.moduleCategory.create({
      data: {
        module,
        name,
        section,
      },
    });
  }

  async deleteModuleCategory(categoryId: number) {
    const existing = await this.prisma.moduleCategory.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
        module: true,
        name: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const [, clearResult] = await this.prisma.$transaction([
      this.prisma.moduleCategory.delete({
        where: {
          id: categoryId,
        },
      }),
      this.prisma.document.updateMany({
        where: {
          module: existing.module,
          customCategory: existing.name,
        },
        data: {
          customCategory: null,
        },
      }),
    ]);

    return {
      success: true,
      clearedCount: clearResult.count,
    };
  }

  async clearCustomCategory(input: {
    module?: string;
    section?: string;
    customCategory?: string;
  }) {
    const module = this.parseUploadModule(input.module);
    const section = this.parseUploadSection(input.section);

    if (!isSectionInModule(module, section)) {
      throw new BadRequestException('Section does not belong to selected module');
    }

    const customCategory = this.normalizeCustomCategory(input.customCategory);
    if (!customCategory) {
      throw new BadRequestException('customCategory is required');
    }

    const result = await this.prisma.document.updateMany({
      where: {
        module,
        section,
        customCategory,
      },
      data: {
        customCategory: null,
      },
    });

    return {
      success: true,
      clearedCount: result.count,
    };
  }

  resolveFilePath(category: string, fileName: string) {
    const safeCategory = this.parseCategory(category);
    const safeFileName = basename(fileName);
    const fullPath = join(this.storageDirs[safeCategory], safeFileName);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    return fullPath;
  }

  async deleteLibraryEntry(documentId: number) {
    const existing = await this.prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        fileName: true,
        category: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Media not found');
    }

    await this.prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    const filePath = join(this.storageDirs[existing.category], basename(existing.fileName));
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    return {
      success: true,
    };
  }

  private buildFileUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    category: UploadCategory,
    fileName: string,
  ) {
    const normalizedPrefix = (process.env.API_PREFIX ?? '').replace(/^\/+|\/+$/g, '');

    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      const normalizedPrefixEscaped = normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hasPrefixAlready =
        normalizedPrefix.length > 0 && new RegExp(`/${normalizedPrefixEscaped}$`).test(normalizedBaseUrl);

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

  private parseCategory(category: string): UploadCategory {
    if (
      category === UploadCategory.images ||
      category === UploadCategory.videos ||
      category === UploadCategory.documents
    ) {
      return category;
    }

    throw new NotFoundException('Category not found');
  }

  private parseUploadModule(module: string | undefined): UploadModule {
    if (!module || !isUploadModule(module)) {
      throw new BadRequestException('Invalid module');
    }

    return module as UploadModule;
  }

  private parseUploadSection(section: string | undefined): UploadSection {
    if (!section || !isUploadSection(section)) {
      throw new BadRequestException('Invalid section');
    }

    return section as UploadSection;
  }

  private parseMediaType(mediaType: string): UploadMediaType {
    if (
      mediaType === UploadMediaType.image ||
      mediaType === UploadMediaType.video ||
      mediaType === UploadMediaType.document
    ) {
      return mediaType;
    }

    throw new BadRequestException('Invalid mediaType');
  }

  private getCategoryFromMimeType(mimeType: string): UploadCategory {
    if (mimeType.startsWith('image/')) {
      return UploadCategory.images;
    }

    if (mimeType.startsWith('video/')) {
      return UploadCategory.videos;
    }

    return UploadCategory.documents;
  }

  private getMediaType(mimeType: string): UploadMediaType {
    if (mimeType.startsWith('image/')) {
      return UploadMediaType.image;
    }

    if (mimeType.startsWith('video/')) {
      return UploadMediaType.video;
    }

    return UploadMediaType.document;
  }

  private ensureStorageFolders() {
    const folders = Object.values(this.storageDirs);
    for (const folder of folders) {
      if (!existsSync(folder)) {
        mkdirSync(folder, { recursive: true });
      }
    }
  }

  private resolveStorageRoot(storageRootPath: string | undefined) {
    if (!storageRootPath) {
      return join(process.cwd(), 'uploads');
    }

    return isAbsolute(storageRootPath)
      ? storageRootPath
      : resolve(process.cwd(), storageRootPath);
  }

  private normalizeOriginalName(originalName: string) {
    if (/[\u3400-\u9FFF]/.test(originalName)) {
      return originalName;
    }

    const decodedName = Buffer.from(originalName, 'latin1').toString('utf8');
    if (/[\u3400-\u9FFF]/.test(decodedName)) {
      return decodedName;
    }

    return originalName;
  }

  private resolveMimeType(mimeType: string, originalName: string) {
    const normalizedMimeType = mimeType.trim().toLowerCase();
    if (
      normalizedMimeType &&
      normalizedMimeType !== 'application/octet-stream' &&
      normalizedMimeType !== '*/*'
    ) {
      return normalizedMimeType;
    }

    const extension = extname(originalName || '').replace('.', '').toLowerCase();
    return this.fallbackMimeTypesByExtension[extension] ?? normalizedMimeType;
  }

  private normalizeCustomCategory(value: string | undefined) {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (trimmed.length > 80) {
      throw new BadRequestException('customCategory must be 80 characters or less');
    }

    return trimmed;
  }
}
