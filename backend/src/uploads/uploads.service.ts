import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import {
  isSectionInModule,
  isUploadModule,
  isUploadSection,
  type UploadModule,
  type UploadSection,
} from './upload-taxonomy';

type UploadCategory = 'images' | 'videos' | 'documents';
type UploadMediaType = 'image' | 'video' | 'document';

type StoredUploadMetadata = {
  fileName: string;
  category: UploadCategory;
  originalName: string;
  mimeType: string;
  size: number;
  mediaType: UploadMediaType;
  module: UploadModule;
  section: UploadSection;
  uploadedAt: string;
  uploadedByUserId: number | null;
};

@Injectable()
export class UploadsService {
  private readonly storageRoot =
    process.env.STORAGE_ROOT_PATH ?? join(process.cwd(), 'uploads');
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
  private readonly metadataFilePath = join(this.storageRoot, 'library-index.json');
  private readonly storageDirs: Record<UploadCategory, string> = {
    images: join(this.storageRoot, 'images'),
    videos: join(this.storageRoot, 'videos'),
    documents: join(this.storageRoot, 'documents'),
  };

  constructor() {
    this.ensureStorageFolders();
  }

  getDestinationByMimeType(mimeType: string) {
    if (mimeType.startsWith('image/')) {
      return this.storageDirs.images;
    }

    if (mimeType.startsWith('video/')) {
      return this.storageDirs.videos;
    }

    return this.storageDirs.documents;
  }

  createStoredFileName(originalName: string) {
    const fileExtension = extname(originalName || '').toLowerCase();
    return `${randomUUID()}${fileExtension}`;
  }

  handleSingleUpload(
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

    this.appendMetadata({
      fileName: file.filename,
      category,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      mediaType,
      module,
      section,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: metadataInput.uploadedByUserId ?? null,
    });

    return {
      fileName: file.filename,
      category,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileUrl: this.buildFileUrl(req, category, file.filename),
      mediaType,
      module,
      section,
    };
  }

  handleMultipleUpload(
    files: Express.Multer.File[],
    req: { protocol: string; get: (name: string) => string | undefined },
    metadataInput: { module?: string; section?: string; uploadedByUserId?: number },
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    return files.map((file) => this.handleSingleUpload(file, req, metadataInput));
  }

  listLibrary(
    req: { protocol: string; get: (name: string) => string | undefined },
    filters: { module?: string; section?: string; mediaType?: string },
  ) {
    const entries = this.readMetadata();
    const moduleFilter = filters.module
      ? this.parseUploadModule(filters.module)
      : undefined;
    const sectionFilter = filters.section
      ? this.parseUploadSection(filters.section)
      : undefined;
    const mediaTypeFilter = filters.mediaType
      ? this.parseMediaType(filters.mediaType)
      : undefined;

    return entries
      .filter((entry) => {
        if (moduleFilter && entry.module !== moduleFilter) {
          return false;
        }

        if (sectionFilter && entry.section !== sectionFilter) {
          return false;
        }

        if (mediaTypeFilter && entry.mediaType !== mediaTypeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
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
      category === 'images' ||
      category === 'videos' ||
      category === 'documents'
    ) {
      return category;
    }

    throw new NotFoundException('Category not found');
  }

  private parseUploadModule(module: string | undefined): UploadModule {
    if (!module || !isUploadModule(module)) {
      throw new BadRequestException('Invalid module');
    }

    return module;
  }

  private parseUploadSection(section: string | undefined): UploadSection {
    if (!section || !isUploadSection(section)) {
      throw new BadRequestException('Invalid section');
    }

    return section;
  }

  private parseMediaType(mediaType: string): UploadMediaType {
    if (mediaType === 'image' || mediaType === 'video' || mediaType === 'document') {
      return mediaType;
    }

    throw new BadRequestException('Invalid mediaType');
  }

  private getCategoryFromMimeType(mimeType: string): UploadCategory {
    if (mimeType.startsWith('image/')) {
      return 'images';
    }

    if (mimeType.startsWith('video/')) {
      return 'videos';
    }

    return 'documents';
  }

  private getMediaType(mimeType: string): UploadMediaType {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    if (mimeType.startsWith('video/')) {
      return 'video';
    }

    return 'document';
  }

  private appendMetadata(entry: StoredUploadMetadata) {
    const entries = this.readMetadata();
    entries.push(entry);
    this.writeMetadata(entries);
  }

  private readMetadata(): StoredUploadMetadata[] {
    if (!existsSync(this.metadataFilePath)) {
      return [];
    }

    try {
      const raw = readFileSync(this.metadataFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as StoredUploadMetadata[];
    } catch {
      return [];
    }
  }

  private writeMetadata(entries: StoredUploadMetadata[]) {
    writeFileSync(this.metadataFilePath, JSON.stringify(entries, null, 2), 'utf-8');
  }

  private ensureStorageFolders() {
    const folders = Object.values(this.storageDirs);
    for (const folder of folders) {
      if (!existsSync(folder)) {
        mkdirSync(folder, { recursive: true });
      }
    }
  }
}
