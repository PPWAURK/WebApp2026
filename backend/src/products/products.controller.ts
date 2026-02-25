import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';

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
}
