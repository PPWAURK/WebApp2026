import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    role: string;
    restaurantId: number | null;
  };
};

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List users with training access configuration' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('training-access')
  async listUsersTrainingAccess(
    @Req() req: AuthenticatedRequest,
    @Query('restaurantId') restaurantIdRaw: string | undefined,
  ) {
    const actor = req.user;

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      throw new ForbiddenException('Only ADMIN and MANAGER can access this resource');
    }

    const restaurantId = restaurantIdRaw ? Number(restaurantIdRaw) : undefined;

    if (
      restaurantIdRaw &&
      (!Number.isInteger(restaurantId) || (restaurantId ?? 0) <= 0)
    ) {
      throw new BadRequestException('restaurantId must be a positive integer');
    }

    return this.usersService.listUsersTrainingAccess(restaurantId, {
      actorId: actor.id,
      actorRole: actor.role,
      actorRestaurantId: actor.restaurantId,
    });
  }

  @ApiOperation({ summary: 'Update one user training section access' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/training-access')
  async updateTrainingAccess(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
    @Body('sections') sections: string[] | undefined,
  ) {
    const actor = req.user;

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      throw new ForbiddenException('Only ADMIN and MANAGER can access this resource');
    }

    return this.usersService.updateTrainingAccess(userId, sections, {
      actorId: actor.id,
      actorRole: actor.role,
      actorRestaurantId: actor.restaurantId,
    });
  }

  @ApiOperation({ summary: 'List employees not yet assigned to any restaurant' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('unassigned')
  listUnassignedUsers(@Req() req: AuthenticatedRequest) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.usersService.listUnassignedEmployees();
  }

  @ApiOperation({ summary: 'Assign one user to one restaurant' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/restaurant')
  updateUserRestaurant(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
    @Body('restaurantId', ParseIntPipe) restaurantId: number,
  ) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.usersService.assignUserRestaurant(userId, restaurantId);
  }

  @ApiOperation({ summary: 'Set or unset manager role for one user (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/manager-role')
  updateManagerRole(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
    @Body('isManager') isManager: boolean | undefined,
    @Body('restaurantId') restaurantIdRaw: number | undefined,
  ) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    if (typeof isManager !== 'boolean') {
      throw new BadRequestException('isManager must be a boolean');
    }

    if (restaurantIdRaw !== undefined && (!Number.isInteger(restaurantIdRaw) || restaurantIdRaw <= 0)) {
      throw new BadRequestException('restaurantId must be a positive integer');
    }

    return this.usersService.updateManagerRole(userId, {
      isManager,
      restaurantId: restaurantIdRaw,
      actorId: req.user.id,
    });
  }
}
