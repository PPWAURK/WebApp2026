import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSupplierOrderSettingsDto } from './dto/update-supplier-order-settings.dto';
import { SuppliersService } from './suppliers.service';

const ORDER_ACCESS_LEVELS = [
  'L5_PAM',
  'L5_AM',
  'L6_PM',
  'L6_MA',
  'L7_PDI',
  'L7_D',
];

type AuthenticatedRequest = Request & {
  user?: {
    role?: string;
    employeeLevel?: string;
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
    const level = req.user?.employeeLevel;
    const canAccess =
      role === 'ADMIN' ||
      role === 'REGIONAL_MANAGER' ||
      role === 'MANAGER' ||
      (role === 'EMPLOYEE' &&
        level !== undefined &&
        ORDER_ACCESS_LEVELS.includes(level));

    if (!canAccess) {
      throw new ForbiddenException('Insufficient level to access suppliers');
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

  @ApiOperation({ summary: 'Update supplier display order' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('order')
  reorderSuppliers(
    @Req() req: AuthenticatedRequest,
    @Body('supplierIds') supplierIds: unknown,
  ) {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can reorder suppliers');
    }

    return this.suppliersService.reorderSuppliers(supplierIds);
  }

  @ApiOperation({ summary: 'Update supplier order generation settings' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/order-settings')
  updateSupplierOrderSettings(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) supplierId: number,
    @Body() body: UpdateSupplierOrderSettingsDto,
  ) {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only ADMIN can update supplier order settings',
      );
    }

    return this.suppliersService.updateSupplierOrderSettings(supplierId, body);
  }

  @ApiOperation({ summary: 'Delete one supplier' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteSupplier(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) supplierId: number,
  ) {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can delete suppliers');
    }

    return this.suppliersService.deleteSupplier(supplierId);
  }
}
