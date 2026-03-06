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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const orders_service_1 = require("./orders.service");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    createOrder(req, body) {
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        return this.ordersService.createOrder({
            id: user.id,
            role: user.role,
            restaurantId: user.restaurantId,
        }, body, req);
    }
    listOrders(req) {
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        return this.ordersService.listOrders({
            id: user.id,
            role: user.role,
            restaurantId: user.restaurantId,
        }, req);
    }
    topOrderedProducts(req, supplierIdRaw, monthRaw) {
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        if (supplierIdRaw && !/^\d+$/.test(supplierIdRaw)) {
            throw new common_1.BadRequestException('supplierId must be a positive integer');
        }
        const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
        if (supplierId !== undefined && supplierId <= 0) {
            throw new common_1.BadRequestException('supplierId must be a positive integer');
        }
        if (monthRaw && !/^\d{4}-\d{2}$/.test(monthRaw)) {
            throw new common_1.BadRequestException('month must match YYYY-MM');
        }
        return this.ordersService.getTopOrderedProductsBySupplier({
            id: user.id,
            role: user.role,
            restaurantId: user.restaurantId,
        }, supplierId, monthRaw);
    }
    topOrderedProductMonths(req, supplierIdRaw) {
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        if (supplierIdRaw && !/^\d+$/.test(supplierIdRaw)) {
            throw new common_1.BadRequestException('supplierId must be a positive integer');
        }
        const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
        if (supplierId !== undefined && supplierId <= 0) {
            throw new common_1.BadRequestException('supplierId must be a positive integer');
        }
        return this.ordersService.getTopOrderedProductMonths({
            id: user.id,
            role: user.role,
            restaurantId: user.restaurantId,
        }, supplierId);
    }
    historyAnalytics(req, supplierIdRaw, periodRaw) {
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        if (supplierIdRaw && !/^\d+$/.test(supplierIdRaw)) {
            throw new common_1.BadRequestException('supplierId must be a positive integer');
        }
        const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
        if (supplierId !== undefined && supplierId <= 0) {
            throw new common_1.BadRequestException('supplierId must be a positive integer');
        }
        return this.ordersService.getOrderHistoryAnalytics({
            id: user.id,
            role: user.role,
            restaurantId: user.restaurantId,
        }, {
            supplierId,
            period: periodRaw,
        });
    }
    async downloadCommande(req, res, orderId) {
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        const fullPath = await this.ordersService.resolveOrderFilePath(orderId, {
            id: user.id,
            role: user.role,
            restaurantId: user.restaurantId,
        });
        return res.download(fullPath);
    }
    async downloadBonLegacy(req, res, orderId) {
        return this.downloadCommande(req, res, orderId);
    }
    deleteOrder(req, orderId) {
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Unauthenticated request');
        }
        return this.ordersService.deleteOrder(orderId, {
            id: user.id,
            role: user.role,
            restaurantId: user.restaurantId,
        });
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create one supplier-specific purchase order' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List purchase orders (restaurant scoped)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listOrders", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Top 5 ordered products for dashboard (optionally filtered by supplier)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('dashboard/top-products'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('supplierId')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "topOrderedProducts", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List available months for top-products chart' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('dashboard/top-product-months'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('supplierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "topOrderedProductMonths", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Order history analytics by supplier and period' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('history/analytics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('supplierId')),
    __param(2, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "historyAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Download order PDF by order id' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/commande'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "downloadCommande", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Download order PDF by order id (legacy path)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/bon'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "downloadBonLegacy", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete purchase order by order id' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "deleteOrder", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('orders'),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map