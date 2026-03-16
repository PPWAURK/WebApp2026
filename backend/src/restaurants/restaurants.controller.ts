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
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

type AuthenticatedRequest = Request & {
  user?: {
    role?: string;
  };
};

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @ApiOperation({ summary: 'List available restaurants' })
  @Get()
  listRestaurants() {
    return this.restaurantsService.listRestaurants();
  }

  @ApiOperation({ summary: 'Create one restaurant (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createRestaurant(
    @Req() req: AuthenticatedRequest,
    @Body() createRestaurantDto: CreateRestaurantDto,
  ) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.restaurantsService.createRestaurant(createRestaurantDto);
  }
}
