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
import { existsSync, mkdirSync } from 'fs';
import { basename, isAbsolute, join, resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  isSectionInModule,
  isUploadModule,
  isUploadSection,
} from './upload-taxonomy';

@Injectable()
export class UploadsService {
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
    metadataInput: { module?: string; section?: string; uploadedByUserId?: number },
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const module = this.parseUploadModule(metadataInput.module);
    const section = this.parseUploadSection(metadataInput.section);

    if (!isSectionInModule(module, section)) {
      throw new BadRequestException('Section does not belong to selected module');
    }

    const category = this.getCategoryFromMimeType(file.mimetype);
    const mediaType = this.getMediaType(file.mimetype);
    const normalizedOriginalName = this.normalizeOriginalName(file.originalname);

    const createdDocument = await this.prisma.document.create({
      data: {
      fileName: file.filename,
      category,
      originalName: normalizedOriginalName,
      mimeType: file.mimetype,
      size: file.size,
      mediaType,
      module,
      section,
        uploadedByUserId: metadataInput.uploadedByUserId ?? null,
      },
    });

    return {
      fileName: createdDocument.fileName,
      category: createdDocument.category,
      originalName: createdDocument.originalName,
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
    metadataInput: { module?: string; section?: string; uploadedByUserId?: number },
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
    filters: { module?: string; section?: string; mediaType?: string },
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

    const where: Prisma.DocumentWhereInput = {
      ...(moduleFilter ? { module: moduleFilter } : {}),
      ...(sectionFilter ? { section: sectionFilter } : {}),
      ...(mediaTypeFilter ? { mediaType: mediaTypeFilter } : {}),
    };

    const entries = await this.prisma.document.findMany({
      where,
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return entries
      .map((entry) => ({
        ...entry,
        fileUrl: this.buildFileUrl(req, entry.category, entry.fileName),
      }));
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

  private buildFileUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    category: UploadCategory,
    fileName: string,
  ) {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/uploads/${category}/${fileName}`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/${category}/${fileName}`;
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
}
