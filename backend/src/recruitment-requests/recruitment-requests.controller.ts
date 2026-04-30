import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRecruitmentRequestDto } from './dto/create-recruitment-request.dto';
import { ListRecruitmentRequestsQueryDto } from './dto/list-recruitment-requests-query.dto';
import { UpdateRecruitmentRequestStatusDto } from './dto/update-recruitment-request-status.dto';
import { RecruitmentRequestsService } from './recruitment-requests.service';
import type {
  RecruitmentRequestActor,
  RecruitmentRequestSummary,
} from './recruitment-requests.types';

@ApiTags('recruitment-requests')
@Controller('recruitment-requests')
export class RecruitmentRequestsController {
  constructor(
    private readonly recruitmentRequestsService: RecruitmentRequestsService,
  ) {}

  private getActor(req: AuthenticatedRequest): RecruitmentRequestActor {
    const user = req.user;

    if (!user?.id || !user.role) {
      throw new ForbiddenException('Unauthenticated request');
    }

    return {
      id: user.id,
      role: user.role,
      restaurantId: user.restaurantId ?? null,
      managedRestaurantIds: (user.managedRestaurants ?? []).map(
        (restaurant) => restaurant.id,
      ),
    };
  }

  @ApiOperation({ summary: 'Create one recruitment request' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createRecruitmentRequest(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateRecruitmentRequestDto,
  ): Promise<RecruitmentRequestSummary> {
    return this.recruitmentRequestsService.createRecruitmentRequest(
      this.getActor(req),
      body,
    );
  }

  @ApiOperation({ summary: 'List recruitment requests (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listRecruitmentRequests(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListRecruitmentRequestsQueryDto,
  ): Promise<RecruitmentRequestSummary[]> {
    return this.recruitmentRequestsService.listRecruitmentRequests(
      this.getActor(req),
      query.status,
    );
  }

  @ApiOperation({ summary: 'Update recruitment request status (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateRecruitmentRequestStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) requestId: number,
    @Body() body: UpdateRecruitmentRequestStatusDto,
  ): Promise<RecruitmentRequestSummary> {
    return this.recruitmentRequestsService.updateRecruitmentRequestStatus(
      this.getActor(req),
      requestId,
      body.status,
    );
  }
}
