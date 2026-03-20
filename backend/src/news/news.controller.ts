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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateNewsPostDto } from './dto/create-news-post.dto';
import { ListNewsPostsQueryDto } from './dto/list-news-posts-query.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  private getAuthenticatedActor(req: AuthenticatedRequest): {
    id: number;
    role: string;
    trainingAccess?: string[];
    employeeLevel?: string;
  } {
    const actor = req.user;

    if (!actor?.id || !actor.role) {
      throw new ForbiddenException('Unauthenticated request');
    }

    return {
      id: actor.id,
      role: actor.role,
      trainingAccess: actor.trainingAccess,
      employeeLevel: actor.employeeLevel,
    };
  }

  private ensureSupportedRole(role: string) {
    if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'EMPLOYEE') {
      throw new ForbiddenException('Unsupported role');
    }
  }

  @ApiOperation({ summary: 'Create one news post (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createNewsPost(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateNewsPostDto,
  ) {
    const actor = this.getAuthenticatedActor(req);

    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.newsService.createNewsPost(req, {
      ...body,
      createdByUserId: actor.id,
    });
  }

  @ApiOperation({ summary: 'List news feed for current user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listNewsPosts(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListNewsPostsQueryDto,
  ) {
    const actor = this.getAuthenticatedActor(req);
    this.ensureSupportedRole(actor.role);

    return this.newsService.listNewsPosts(req, {
      userId: actor.id,
      role: actor.role,
      trainingAccess: actor.trainingAccess,
      employeeLevel: actor.employeeLevel,
      limit: query.limit,
      month: query.month,
      tag: query.tag,
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
    const actor = this.getAuthenticatedActor(req);

    if (actor.role !== 'ADMIN') {
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
    const actor = this.getAuthenticatedActor(req);
    this.ensureSupportedRole(actor.role);

    return this.newsService.markNewsAsRead(newsId, actor.id, {
      role: actor.role,
      trainingAccess: actor.trainingAccess,
      employeeLevel: actor.employeeLevel,
    });
  }

  @ApiOperation({
    summary: 'Get read tracking by restaurant for one news post (admin only)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/read-tracking')
  getNewsReadTracking(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) newsId: number,
  ) {
    const actor = this.getAuthenticatedActor(req);

    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.newsService.getNewsReadTracking(newsId);
  }
}
