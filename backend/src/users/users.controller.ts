import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  async listUsersTrainingAccess(@Req() req: AuthenticatedRequest) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.usersService.listUsersTrainingAccess();
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
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.usersService.updateTrainingAccess(userId, sections);
  }
}
