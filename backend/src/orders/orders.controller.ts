import {
  ForbiddenException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
}
