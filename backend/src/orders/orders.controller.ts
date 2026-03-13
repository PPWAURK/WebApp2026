import {
  BadRequestException,
  ForbiddenException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    role: string;
    restaurantId: number | null;
  };
};

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create one supplier-specific purchase order' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      deliveryDate: string;
      items: Array<{ productId: number; quantity: number }>;
    },
  ) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    return this.ordersService.createOrder(
      {
        id: user.id,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      body,
      req,
    );
  }

  @ApiOperation({ summary: 'List purchase orders (restaurant scoped)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listOrders(@Req() req: AuthenticatedRequest) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    return this.ordersService.listOrders(
      {
        id: user.id,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      req,
    );
  }

  @ApiOperation({
    summary:
      'Top 5 ordered products for dashboard (optionally filtered by supplier)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('dashboard/top-products')
  topOrderedProducts(
    @Req() req: AuthenticatedRequest,
    @Query('supplierId') supplierIdRaw?: string,
    @Query('month') monthRaw?: string,
  ) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    if (supplierIdRaw && !/^\d+$/.test(supplierIdRaw)) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
    if (supplierId !== undefined && supplierId <= 0) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    if (monthRaw && !/^\d{4}-\d{2}$/.test(monthRaw)) {
      throw new BadRequestException('month must match YYYY-MM');
    }

    return this.ordersService.getTopOrderedProductsBySupplier(
      {
        id: user.id,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      supplierId,
      monthRaw,
    );
  }

  @ApiOperation({ summary: 'List available months for top-products chart' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('dashboard/top-product-months')
  topOrderedProductMonths(
    @Req() req: AuthenticatedRequest,
    @Query('supplierId') supplierIdRaw?: string,
  ) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    if (supplierIdRaw && !/^\d+$/.test(supplierIdRaw)) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
    if (supplierId !== undefined && supplierId <= 0) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    return this.ordersService.getTopOrderedProductMonths(
      {
        id: user.id,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      supplierId,
    );
  }

  @ApiOperation({ summary: 'Order history analytics by supplier and period' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history/analytics')
  historyAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('supplierId') supplierIdRaw?: string,
    @Query('period') periodRaw?: string,
  ) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    if (supplierIdRaw && !/^\d+$/.test(supplierIdRaw)) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
    if (supplierId !== undefined && supplierId <= 0) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    return this.ordersService.getOrderHistoryAnalytics(
      {
        id: user.id,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      {
        supplierId,
        period: periodRaw,
      },
    );
  }

  @ApiOperation({ summary: 'Download order PDF by order id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/commande')
  async downloadCommande(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    const fullPath = await this.ordersService.resolveOrderFilePath(orderId, {
      id: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
    });

    return res.download(fullPath);
  }

  @ApiOperation({ summary: 'Download order PDF by order id (legacy path)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/bon')
  async downloadBonLegacy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.downloadCommande(req, res, orderId);
  }

  @ApiOperation({ summary: 'Delete purchase order by order id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    return this.ordersService.deleteOrder(orderId, {
      id: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
    });
  }
}
