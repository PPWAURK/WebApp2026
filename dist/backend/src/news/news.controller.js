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
exports.NewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const news_service_1 = require("./news.service");
let NewsController = class NewsController {
    newsService;
    constructor(newsService) {
        this.newsService = newsService;
    }
    createNewsPost(req, title, message, audience, module, section, attachmentDocumentIdRaw) {
        const actor = req.user;
        if (!actor?.id || actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
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
    listNewsPosts(req, limitRaw, month) {
        const actor = req.user;
        if (!actor?.id || !actor.role) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER' && actor.role !== 'EMPLOYEE') {
            throw new common_1.ForbiddenException('Unsupported role');
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
    deleteNewsPost(req, newsId) {
        const actor = req.user;
        if (!actor?.id || actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        return this.newsService.deleteNewsPost(newsId);
    }
    markNewsAsRead(req, newsId) {
        const actor = req.user;
        if (!actor?.id || !actor.role) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER' && actor.role !== 'EMPLOYEE') {
            throw new common_1.ForbiddenException('Unsupported role');
        }
        return this.newsService.markNewsAsRead(newsId, actor.id, {
            role: actor.role,
            trainingAccess: actor.trainingAccess,
        });
    }
    getNewsReadTracking(req, newsId) {
        const actor = req.user;
        if (!actor?.id || actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        return this.newsService.getNewsReadTracking(newsId);
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create one news post (admin only)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.Body)('message')),
    __param(3, (0, common_1.Body)('audience')),
    __param(4, (0, common_1.Body)('module')),
    __param(5, (0, common_1.Body)('section')),
    __param(6, (0, common_1.Body)('attachmentDocumentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "createNewsPost", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List news feed for current user' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "listNewsPosts", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete one news post (admin only)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "deleteNewsPost", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Mark one news post as read for current user' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "markNewsAsRead", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get read tracking by restaurant for one news post (admin only)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/read-tracking'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getNewsReadTracking", null);
exports.NewsController = NewsController = __decorate([
    (0, swagger_1.ApiTags)('news'),
    (0, common_1.Controller)('news'),
    __metadata("design:paramtypes", [news_service_1.NewsService])
], NewsController);
//# sourceMappingURL=news.controller.js.map