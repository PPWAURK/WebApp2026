"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("./users.service");
const STORAGE_ROOT_PATH = process.env.STORAGE_ROOT_PATH && (0, path_1.isAbsolute)(process.env.STORAGE_ROOT_PATH)
    ? process.env.STORAGE_ROOT_PATH
    : (0, path_1.resolve)(process.cwd(), process.env.STORAGE_ROOT_PATH ?? 'uploads');
const PROFILE_IMAGE_DIR = (0, path_1.join)(STORAGE_ROOT_PATH, 'images');
function ensureImageDirectoryExists() {
    if (!(0, fs_1.existsSync)(PROFILE_IMAGE_DIR)) {
        (0, fs_1.mkdirSync)(PROFILE_IMAGE_DIR, { recursive: true });
    }
}
function createStoredFileName(originalName) {
    const fileExtension = (0, path_1.extname)(originalName || '').toLowerCase();
    return `${(0, crypto_1.randomUUID)()}${fileExtension}`;
}
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async listUsersTrainingAccess(req, restaurantIdRaw) {
        const actor = req.user;
        if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Only ADMIN and MANAGER can access this resource');
        }
        const restaurantId = restaurantIdRaw ? Number(restaurantIdRaw) : undefined;
        if (restaurantIdRaw &&
            (!Number.isInteger(restaurantId) || (restaurantId ?? 0) <= 0)) {
            throw new common_1.BadRequestException('restaurantId must be a positive integer');
        }
        return this.usersService.listUsersTrainingAccess(restaurantId, {
            actorId: actor.id,
            actorRole: actor.role,
            actorRestaurantId: actor.restaurantId,
        });
    }
    async updateTrainingAccess(req, userId, sections) {
        const actor = req.user;
        if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Only ADMIN and MANAGER can access this resource');
        }
        return this.usersService.updateTrainingAccess(userId, sections, {
            actorId: actor.id,
            actorRole: actor.role,
            actorRestaurantId: actor.restaurantId,
        });
    }
    listTrainingAccessByLevel(req) {
        const actor = req.user;
        if (!actor || actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        return this.usersService.listTrainingAccessByLevel(actor.role);
    }
    updateTrainingAccessByLevel(req, levelRaw, sections) {
        const actor = req.user;
        if (!actor || actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        if (!Object.values(client_1.EmployeeLevel).includes(levelRaw)) {
            throw new common_1.BadRequestException('Invalid employee level');
        }
        return this.usersService.updateTrainingAccessByLevel(levelRaw, sections, {
            actorRole: actor.role,
        });
    }
    listUnassignedUsers(req) {
        if (req.user?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        return this.usersService.listUnassignedEmployees();
    }
    updateUserRestaurant(req, userId, restaurantId) {
        if (req.user?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        return this.usersService.assignUserRestaurant(userId, restaurantId);
    }
    updateManagerRole(req, userId, isManager, restaurantIdRaw) {
        if (req.user?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        if (typeof isManager !== 'boolean') {
            throw new common_1.BadRequestException('isManager must be a boolean');
        }
        if (restaurantIdRaw !== undefined && (!Number.isInteger(restaurantIdRaw) || restaurantIdRaw <= 0)) {
            throw new common_1.BadRequestException('restaurantId must be a positive integer');
        }
        return this.usersService.updateManagerRole(userId, {
            isManager,
            restaurantId: restaurantIdRaw,
            actorId: req.user.id,
        });
    }
    confirmEmployeeProbation(req, userId) {
        const actor = req.user;
        if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Only ADMIN and MANAGER can access this resource');
        }
        return this.usersService.confirmEmployeeProbation(userId, {
            actorId: actor.id,
            actorRole: actor.role,
            actorRestaurantId: actor.restaurantId,
        });
    }
    approveEmployeeAccount(req, userId) {
        const actor = req.user;
        if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Only ADMIN and MANAGER can access this resource');
        }
        return this.usersService.approveEmployeeAccount(userId, {
            actorRole: actor.role,
            actorRestaurantId: actor.restaurantId,
        });
    }
    deleteEmployeeAccount(req, userId) {
        const actor = req.user;
        if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Only ADMIN and MANAGER can access this resource');
        }
        return this.usersService.deleteEmployeeAccount(userId, {
            actorRole: actor.role,
            actorRestaurantId: actor.restaurantId,
        });
    }
    updateEmployeeLevel(req, userId, levelRaw) {
        const actor = req.user;
        if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Only ADMIN and MANAGER can access this resource');
        }
        if (!levelRaw || !Object.values(client_1.EmployeeLevel).includes(levelRaw)) {
            throw new common_1.BadRequestException('Invalid employee level');
        }
        return this.usersService.updateEmployeeLevel(userId, levelRaw, {
            actorId: actor.id,
            actorRole: actor.role,
            actorRestaurantId: actor.restaurantId,
        });
    }
    updateOwnProfilePhoto(req, file) {
        if (!req.user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        return this.usersService.updateOwnProfilePhoto(req.user.id, file, req);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List users with training access configuration' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('training-access'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listUsersTrainingAccess", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update one user training section access' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/training-access'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('sections')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateTrainingAccess", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List global training access by employee level (admin)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('training-access-by-level'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listTrainingAccessByLevel", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update global training access profile for one employee level (admin)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('training-access-by-level/:level'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('level')),
    __param(2, (0, common_1.Body)('sections')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateTrainingAccessByLevel", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List employees not yet assigned to any restaurant' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('unassigned'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listUnassignedUsers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Assign one user to one restaurant' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/restaurant'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('restaurantId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUserRestaurant", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Set or unset manager role for one user (admin only)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/manager-role'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('isManager')),
    __param(3, (0, common_1.Body)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateManagerRole", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Confirm employee probation status (admin/manager)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/confirm-probation'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "confirmEmployeeProbation", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Approve employee account request (admin/manager)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/approve-account'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "approveEmployeeAccount", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete employee account (admin/manager)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteEmployeeAccount", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update employee level (admin/manager)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/level'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateEmployeeLevel", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload profile photo for current user' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me/profile-photo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
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
                callback(new common_1.BadRequestException('Only image files are allowed'), false);
                return;
            }
            callback(null, true);
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateOwnProfilePhoto", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map