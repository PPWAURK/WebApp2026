import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { basename, extname, join } from 'path';

type UploadCategory = 'images' | 'videos' | 'documents';

@Injectable()
export class UploadsService {
  private readonly storageRoot =
    process.env.STORAGE_ROOT_PATH ?? join(process.cwd(), 'uploads');
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
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    return {
      fileName: file.filename,
      category: this.getCategoryFromMimeType(file.mimetype),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileUrl: this.buildFileUrl(
        req,
        this.getCategoryFromMimeType(file.mimetype),
        file.filename,
      ),
      mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    };
  }

  handleMultipleUpload(
    files: Express.Multer.File[],
    req: { protocol: string; get: (name: string) => string | undefined },
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    return files.map((file) => this.handleSingleUpload(file, req));
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

  private getCategoryFromMimeType(mimeType: string): UploadCategory {
    if (mimeType.startsWith('image/')) {
      return 'images';
    }

    if (mimeType.startsWith('video/')) {
      return 'videos';
    }

    return 'documents';
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
