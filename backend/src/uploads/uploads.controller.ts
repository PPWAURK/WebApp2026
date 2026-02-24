import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

const UPLOAD_MAX_FILE_SIZE = 50 * 1024 * 1024;
const UPLOAD_MAX_FILES = 10;
const STORAGE_ROOT_PATH =
  process.env.STORAGE_ROOT_PATH ?? join(process.cwd(), 'uploads');

function getStorageDirectoryByMimeType(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return join(STORAGE_ROOT_PATH, 'images');
  }

  if (mimeType.startsWith('video/')) {
    return join(STORAGE_ROOT_PATH, 'videos');
  }

  return join(STORAGE_ROOT_PATH, 'documents');
}

function ensureDirectoryExists(directoryPath: string) {
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true });
  }
}

function createStoredFileName(originalName: string) {
  const fileExtension = extname(originalName || '').toLowerCase();
  return `${randomUUID()}${fileExtension}`;
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @ApiOperation({ summary: 'Upload a single image or video' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, file, callback) => {
          const destination = getStorageDirectoryByMimeType(file.mimetype);
          ensureDirectoryExists(destination);
          callback(null, destination);
        },
        filename: (_req, file, callback) => {
          callback(null, createStoredFileName(file.originalname));
        },
      }),
      limits: {
        fileSize: UPLOAD_MAX_FILE_SIZE,
      },
      fileFilter: (_req, file, callback) => {
        if (
          !file.mimetype.startsWith('image/') &&
          !file.mimetype.startsWith('video/')
        ) {
          callback(
            new BadRequestException('Only image and video files are allowed'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadSingle(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.uploadsService.handleSingleUpload(file, req);
  }

  @ApiOperation({ summary: 'Upload multiple image/video files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', UPLOAD_MAX_FILES, {
      storage: diskStorage({
        destination: (_req, file, callback) => {
          const destination = getStorageDirectoryByMimeType(file.mimetype);
          ensureDirectoryExists(destination);
          callback(null, destination);
        },
        filename: (_req, file, callback) => {
          callback(null, createStoredFileName(file.originalname));
        },
      }),
      limits: {
        fileSize: UPLOAD_MAX_FILE_SIZE,
      },
      fileFilter: (_req, file, callback) => {
        if (
          !file.mimetype.startsWith('image/') &&
          !file.mimetype.startsWith('video/')
        ) {
          callback(
            new BadRequestException('Only image and video files are allowed'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this.uploadsService.handleMultipleUpload(files, req);
  }

  @ApiOperation({ summary: 'Get uploaded file by category and file name' })
  @Get(':category/:fileName')
  getUploadedFile(
    @Param('category') category: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const filePath = this.uploadsService.resolveFilePath(category, fileName);
    return res.sendFile(filePath);
  }
}
