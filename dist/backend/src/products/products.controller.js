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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const products_service_1 = require("./products.service");
const STORAGE_ROOT_PATH = process.env.STORAGE_ROOT_PATH && (0, path_1.isAbsolute)(process.env.STORAGE_ROOT_PATH)
    ? process.env.STORAGE_ROOT_PATH
    : (0, path_1.resolve)(process.cwd(), process.env.STORAGE_ROOT_PATH ?? 'uploads');
const PRODUCT_IMAGE_DIR = (0, path_1.join)(STORAGE_ROOT_PATH, 'images');
function ensureImageDirectoryExists() {
    if (!(0, fs_1.existsSync)(PRODUCT_IMAGE_DIR)) {
        (0, fs_1.mkdirSync)(PRODUCT_IMAGE_DIR, { recursive: true });
    }
}
function createStoredFileName(originalName) {
    const fileExtension = (0, path_1.extname)(originalName || '').toLowerCase();
    return `${(0, crypto_1.randomUUID)()}${fileExtension}`;
}
let ProductsController = class ProductsController {
    productsService;
    constructor(productsService) {
        this.productsService = productsService;
    }
    listProducts(req) {
        const role = req.user?.role;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new common_1.ForbiddenException('Only ADMIN and MANAGER can access products');
        }
        return this.productsService.listProducts();
    }
    updateProduct(req, productId, body) {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only ADMIN can update products');
        }
        return this.productsService.updateProduct(productId, body);
    }
    updateProductImage(req, productId, file) {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only ADMIN can update product image');
        }
        return this.productsService.updateProductImage(productId, file, req);
    }
    deleteProduct(req, productId) {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only ADMIN can delete products');
        }
        return this.productsService.deleteProduct(productId);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List products for ordering interface' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "listProducts", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update one product details' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "updateProduct", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload and set product image' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, callback) => {
                ensureImageDirectoryExists();
                callback(null, PRODUCT_IMAGE_DIR);
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
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "updateProductImage", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete one product' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "deleteProduct", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map