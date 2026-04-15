import {
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
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderReturnDto } from './dto/create-order-return.dto';
import {
  HistoryAnalyticsQueryDto,
  HistoryScopeQueryDto,
  SupplierMonthQueryDto,
  SupplierScopedQueryDto,
} from './dto/order-query.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  private getActor(req: AuthenticatedRequest) {
    const user = req.user;

    if (!user?.id || !user.role) {
      throw new ForbiddenException('Unauthenticated request');
    }

    return {
      id: user.id,
      role: user.role,
      employeeLevel: user.employeeLevel ?? null,
      restaurantId: user.restaurantId ?? null,
      managedRestaurantIds: (user.managedRestaurants ?? []).map(
        (restaurant) => restaurant.id,
      ),
    };
  }

  @ApiOperation({ summary: 'Create one supplier-specific purchase order' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(@Req() req: AuthenticatedRequest, @Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(this.getActor(req), body, req);
  }

  @ApiOperation({ summary: 'List purchase orders (restaurant scoped)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listOrders(
    @Req() req: AuthenticatedRequest,
    @Query() query: HistoryScopeQueryDto,
  ) {
    return this.ordersService.listOrders(this.getActor(req), req, {
      restaurantId: query.restaurantId,
    });
  }

  @ApiOperation({ summary: 'List purchase returns (restaurant scoped)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('returns')
  listOrderReturns(
    @Req() req: AuthenticatedRequest,
    @Query() query: HistoryScopeQueryDto,
  ) {
    return this.ordersService.listOrderReturns(this.getActor(req), req, {
      restaurantId: query.restaurantId,
    });
  }

  @ApiOperation({ summary: 'Load one order as a return draft' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/return-draft')
  getOrderReturnDraft(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.getOrderReturnDraft(orderId, this.getActor(req));
  }

  @ApiOperation({ summary: 'Create one purchase return' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('returns')
  createOrderReturn(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateOrderReturnDto,
  ) {
    return this.ordersService.createOrderReturn(this.getActor(req), body);
  }

  @ApiOperation({ summary: 'Delete one purchase return' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('returns/:id')
  deleteOrderReturn(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) returnId: number,
  ) {
    return this.ordersService.deleteOrderReturn(returnId, this.getActor(req));
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
    @Query() query: SupplierMonthQueryDto,
  ) {
    return this.ordersService.getTopOrderedProductsBySupplier(
      this.getActor(req),
      query.supplierId,
      query.month,
    );
  }

  @ApiOperation({ summary: 'List available months for top-products chart' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('dashboard/top-product-months')
  topOrderedProductMonths(
    @Req() req: AuthenticatedRequest,
    @Query() query: SupplierScopedQueryDto,
  ) {
    return this.ordersService.getTopOrderedProductMonths(
      this.getActor(req),
      query.supplierId,
    );
  }

  @ApiOperation({ summary: 'Order history analytics by supplier and period' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history/analytics')
  historyAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query() query: HistoryAnalyticsQueryDto,
  ) {
    return this.ordersService.getOrderHistoryAnalytics(this.getActor(req), {
      supplierId: query.supplierId,
      period: query.period,
      restaurantId: query.restaurantId,
    });
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
    const fullPath = await this.ordersService.resolveOrderFilePath(
      orderId,
      this.getActor(req),
    );

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
    return this.ordersService.deleteOrder(orderId, this.getActor(req));
  }
}
