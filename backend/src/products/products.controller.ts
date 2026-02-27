import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, isAbsolute, join, resolve } from 'path';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';

const STORAGE_ROOT_PATH =
  process.env.STORAGE_ROOT_PATH && isAbsolute(process.env.STORAGE_ROOT_PATH)
    ? process.env.STORAGE_ROOT_PATH
    : resolve(process.cwd(), process.env.STORAGE_ROOT_PATH ?? 'uploads');
const PRODUCT_IMAGE_DIR = join(STORAGE_ROOT_PATH, 'images');

function ensureImageDirectoryExists() {
  if (!existsSync(PRODUCT_IMAGE_DIR)) {
    mkdirSync(PRODUCT_IMAGE_DIR, { recursive: true });
  }
}

function createStoredFileName(originalName: string) {
  const fileExtension = extname(originalName || '').toLowerCase();
  return `${randomUUID()}${fileExtension}`;
}

type AuthenticatedRequest = Request & {
  user?: {
    role?: string;
  };
};

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'List products for ordering interface' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listProducts(@Req() req: AuthenticatedRequest) {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      throw new ForbiddenException('Only ADMIN and MANAGER can access products');
    }

    return this.productsService.listProducts();
  }

  @ApiOperation({ summary: 'Update one product details' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateProduct(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) productId: number,
    @Body()
    body: {
      supplierId?: number;
      reference?: string | null;
      category?: string;
      nameZh?: string;
      nameFr?: string | null;
      specification?: string | null;
      unit?: string | null;
      priceHt?: number | null;
      image?: string | null;
    },
  ) {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can update products');
    }

    return this.productsService.updateProduct(productId, body);
  }

  @ApiOperation({ summary: 'Upload and set product image' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureImageDirectoryExists();
          callback(null, PRODUCT_IMAGE_DIR);
        },
        filename: (_req, file, callback) => {
          callback(null, createStoredFileName(file.originalname));
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  updateProductImage(
    @Req() req: Request & { user?: { role?: string } },
    @Param('id', ParseIntPipe) productId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can update product image');
    }

    return this.productsService.updateProductImage(productId, file, req);
  }

  @ApiOperation({ summary: 'Delete one product' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteProduct(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can delete products');
    }

    return this.productsService.deleteProduct(productId);
  }
}
