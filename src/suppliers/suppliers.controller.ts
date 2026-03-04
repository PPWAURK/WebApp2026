import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuppliersService } from './suppliers.service';

type AuthenticatedRequest = Request & {
  user?: {
    role?: string;
  };
};

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @ApiOperation({ summary: 'List suppliers for orders interface' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listSuppliers(@Req() req: AuthenticatedRequest) {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      throw new ForbiddenException('Only ADMIN and MANAGER can access suppliers');
    }

    return this.suppliersService.listSuppliers();
  }

  @ApiOperation({ summary: 'Create a supplier' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createSupplier(
    @Req() req: AuthenticatedRequest,
    @Body('name') name: string | undefined,
  ) {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can create suppliers');
    }

    return this.suppliersService.createSupplier(name ?? '');
  }
}
