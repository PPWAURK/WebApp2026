import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeeLevel, Role, WorkplaceRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, isAbsolute, join, resolve } from 'path';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

const STORAGE_ROOT_PATH =
  process.env.STORAGE_ROOT_PATH && isAbsolute(process.env.STORAGE_ROOT_PATH)
    ? process.env.STORAGE_ROOT_PATH
    : resolve(process.cwd(), process.env.STORAGE_ROOT_PATH ?? 'uploads');
const PROFILE_IMAGE_DIR = join(STORAGE_ROOT_PATH, 'images');

function ensureImageDirectoryExists() {
  if (!existsSync(PROFILE_IMAGE_DIR)) {
    mkdirSync(PROFILE_IMAGE_DIR, { recursive: true });
  }
}

function createStoredFileName(originalName: string) {
  const fileExtension = extname(originalName || '').toLowerCase();
  return `${randomUUID()}${fileExtension}`;
}

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
      throw new ForbiddenException(
        'Only ADMIN and MANAGER can access this resource',
      );
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
      throw new ForbiddenException(
        'Only ADMIN and MANAGER can access this resource',
      );
    }

    return this.usersService.updateTrainingAccess(userId, sections, {
      actorId: actor.id,
      actorRole: actor.role,
      actorRestaurantId: actor.restaurantId,
    });
  }

  @ApiOperation({
    summary: 'List global training access by employee level (admin)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('training-access-by-level')
  listTrainingAccessByLevel(@Req() req: AuthenticatedRequest) {
    const actor = req.user;

    if (!actor || actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.usersService.listTrainingAccessByLevel(actor.role);
  }

  @ApiOperation({
    summary:
      'Update global training access profile for one employee level (admin)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('training-access-by-level/:level')
  updateTrainingAccessByLevel(
    @Req() req: AuthenticatedRequest,
    @Param('level') levelRaw: string,
    @Body('sections') sections: string[] | undefined,
  ) {
    const actor = req.user;

    if (!actor || actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    if (!Object.values(EmployeeLevel).includes(levelRaw as EmployeeLevel)) {
      throw new BadRequestException('Invalid employee level');
    }

    return this.usersService.updateTrainingAccessByLevel(
      levelRaw as EmployeeLevel,
      sections,
      {
        actorRole: actor.role,
      },
    );
  }

  @ApiOperation({
    summary: 'List training quiz links by section and language',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('training-quiz-links')
  listTrainingQuizLinks(@Req() req: AuthenticatedRequest) {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Unauthorized');
    }

    return this.usersService.listTrainingQuizLinks();
  }

  @ApiOperation({
    summary: 'Create or update one training quiz link (admin)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('training-quiz-links/:section/:language')
  updateTrainingQuizLink(
    @Req() req: AuthenticatedRequest,
    @Param('section') section: string,
    @Param('language') language: string,
    @Body('quizUrl') quizUrl: string | undefined | null,
  ) {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Unauthorized');
    }
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    return this.usersService.upsertTrainingQuizLink(
      section,
      language,
      quizUrl,
      actor.role,
    );
  }

  @ApiOperation({
    summary: 'List employees not yet assigned to any restaurant',
  })
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

  @ApiOperation({
    summary: 'Set or unset manager role for one user (admin only)',
  })
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

    if (
      restaurantIdRaw !== undefined &&
      (!Number.isInteger(restaurantIdRaw) || restaurantIdRaw <= 0)
    ) {
      throw new BadRequestException('restaurantId must be a positive integer');
    }

    return this.usersService.updateManagerRole(userId, {
      isManager,
      restaurantId: restaurantIdRaw,
      actorId: req.user.id,
    });
  }

  @ApiOperation({
    summary: 'Confirm employee probation status (admin/manager)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/confirm-probation')
  confirmEmployeeProbation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    const actor = req.user;

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      throw new ForbiddenException(
        'Only ADMIN and MANAGER can access this resource',
      );
    }

    return this.usersService.confirmEmployeeProbation(userId, {
      actorId: actor.id,
      actorRole: actor.role,
      actorRestaurantId: actor.restaurantId,
    });
  }

  @ApiOperation({ summary: 'Approve employee account request (admin/manager)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve-account')
  approveEmployeeAccount(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    const actor = req.user;

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      throw new ForbiddenException(
        'Only ADMIN and MANAGER can access this resource',
      );
    }

    return this.usersService.approveEmployeeAccount(userId, {
      actorRole: actor.role,
      actorRestaurantId: actor.restaurantId,
    });
  }

  @ApiOperation({ summary: 'Delete employee account (admin/manager)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteEmployeeAccount(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    const actor = req.user;

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      throw new ForbiddenException(
        'Only ADMIN and MANAGER can access this resource',
      );
    }

    return this.usersService.deleteEmployeeAccount(userId, {
      actorRole: actor.role,
      actorRestaurantId: actor.restaurantId,
    });
  }

  @ApiOperation({ summary: 'Update employee level (manager only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/level')
  updateEmployeeLevel(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
    @Body('level') levelRaw: string | undefined,
  ) {
    const actor = req.user;

    if (!actor || actor.role !== 'MANAGER') {
      throw new ForbiddenException('Manager only');
    }

    if (
      !levelRaw ||
      !Object.values(EmployeeLevel).includes(levelRaw as EmployeeLevel)
    ) {
      throw new BadRequestException('Invalid employee level');
    }

    return this.usersService.updateEmployeeLevel(
      userId,
      levelRaw as EmployeeLevel,
      {
        actorId: actor.id,
        actorRole: actor.role,
        actorRestaurantId: actor.restaurantId,
      },
    );
  }

  @ApiOperation({ summary: 'Update employee workplace role (admin/manager)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/workplace-role')
  updateEmployeeWorkplaceRole(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) userId: number,
    @Body('workplaceRole') workplaceRoleRaw: string | undefined,
  ) {
    const actor = req.user;

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      throw new ForbiddenException(
        'Only ADMIN and MANAGER can access this resource',
      );
    }

    if (
      !workplaceRoleRaw ||
      !Object.values(WorkplaceRole).includes(workplaceRoleRaw as WorkplaceRole)
    ) {
      throw new BadRequestException('Invalid workplace role');
    }

    return this.usersService.updateEmployeeWorkplaceRole(
      userId,
      workplaceRoleRaw as WorkplaceRole,
      {
        actorId: actor.id,
        actorRole: actor.role,
        actorRestaurantId: actor.restaurantId,
      },
    );
  }

  @ApiOperation({ summary: 'Update profile for current user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateOwnProfile(
    @Req() req: AuthenticatedRequest,
    @Body('name') nameRaw: string | undefined,
  ) {
    if (!req.user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update own profile name');
    }

    if (typeof nameRaw !== 'string') {
      throw new BadRequestException('name must be a string');
    }

    const name = nameRaw.trim();
    if (!name || name.length > 120) {
      throw new BadRequestException(
        'name must be between 1 and 120 characters',
      );
    }

    return this.usersService.updateOwnProfile(req.user.id, {
      name,
    });
  }

  @ApiOperation({ summary: 'Upload profile photo for current user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureImageDirectoryExists();
          callback(null, PROFILE_IMAGE_DIR);
        },
        filename: (_req, file, callback) => {
          callback(null, createStoredFileName(file.originalname));
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  updateOwnProfilePhoto(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!req.user) {
      throw new ForbiddenException('Unauthenticated request');
    }

    return this.usersService.updateOwnProfilePhoto(req.user.id, file, req);
  }
}
