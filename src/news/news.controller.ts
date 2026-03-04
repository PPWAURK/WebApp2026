import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NewsService } from './news.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number;
    role?: string;
    trainingAccess?: string[];
  };
};

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @ApiOperation({ summary: 'Create one news post (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createNewsPost(
    @Req() req: AuthenticatedRequest,
    @Body('title') title: string | undefined,
    @Body('message') message: string | undefined,
    @Body('audience') audience: string | undefined,
    @Body('module') module: string | undefined,
    @Body('section') section: string | undefined,
    @Body('attachmentDocumentId') attachmentDocumentIdRaw: number | undefined,
  ) {
    const actor = req.user;
    if (!actor?.id || actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.newsService.createNewsPost(req, {
      title: title ?? '',
      message: message ?? '',
      audience,
      module,
      section,
      attachmentDocumentId: attachmentDocumentIdRaw,
      createdByUserId: actor.id,
    });
  }

  @ApiOperation({ summary: 'List news feed for current user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listNewsPosts(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limitRaw: string | undefined,
    @Query('month') month: string | undefined,
  ) {
    const actor = req.user;
    if (!actor?.id || !actor.role) {
      throw new ForbiddenException('Unauthenticated request');
    }

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER' && actor.role !== 'EMPLOYEE') {
      throw new ForbiddenException('Unsupported role');
    }

    const limit = limitRaw ? Number(limitRaw) : undefined;

    return this.newsService.listNewsPosts(req, {
      userId: actor.id,
      role: actor.role,
      trainingAccess: actor.trainingAccess,
      limit,
      month,
    });
  }

  @ApiOperation({ summary: 'Delete one news post (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteNewsPost(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) newsId: number,
  ) {
    const actor = req.user;
    if (!actor?.id || actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.newsService.deleteNewsPost(newsId);
  }

  @ApiOperation({ summary: 'Mark one news post as read for current user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/read')
  markNewsAsRead(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) newsId: number,
  ) {
    const actor = req.user;
    if (!actor?.id || !actor.role) {
      throw new ForbiddenException('Unauthenticated request');
    }

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER' && actor.role !== 'EMPLOYEE') {
      throw new ForbiddenException('Unsupported role');
    }

    return this.newsService.markNewsAsRead(newsId, actor.id, {
      role: actor.role,
      trainingAccess: actor.trainingAccess,
    });
  }

  @ApiOperation({ summary: 'Get read tracking by restaurant for one news post (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/read-tracking')
  getNewsReadTracking(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) newsId: number,
  ) {
    const actor = req.user;
    if (!actor?.id || actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.newsService.getNewsReadTracking(newsId);
  }
}
