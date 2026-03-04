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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
    async listProducts() {
        const products = await this.prisma.produit.findMany({
            orderBy: {
                id: 'asc',
            },
        });
        return products.map((product) => ({
            id: Number(product.id),
            supplierId: product.supplierId,
            reference: product.reference,
            category: product.categorie,
            nameZh: product.nomCn,
            nameFr: product.designationFr,
            specification: product.specification,
            unit: product.unite,
            priceHt: product.prixUHt === null ? null : Number(product.prixUHt),
            image: product.image,
        }));
    }
    async updateProduct(productId, payload) {
        const existing = await this.prisma.produit.findUnique({
            where: { id: BigInt(productId) },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Product not found');
        }
        const data = {};
        if (payload.supplierId !== undefined) {
            if (!Number.isInteger(payload.supplierId) || payload.supplierId <= 0) {
                throw new common_1.BadRequestException('supplierId must be a positive integer');
            }
            data.supplierId = payload.supplierId;
        }
        if (payload.reference !== undefined) {
            data.reference = payload.reference;
        }
        if (payload.category !== undefined) {
            if (!payload.category.trim()) {
                throw new common_1.BadRequestException('category cannot be empty');
            }
            data.categorie = payload.category.trim();
        }
        if (payload.nameZh !== undefined) {
            if (!payload.nameZh.trim()) {
                throw new common_1.BadRequestException('nameZh cannot be empty');
            }
            data.nomCn = payload.nameZh.trim();
        }
        if (payload.nameFr !== undefined) {
            data.designationFr = payload.nameFr;
        }
        if (payload.specification !== undefined) {
            data.specification = payload.specification;
        }
        if (payload.unit !== undefined) {
            data.unite = payload.unit;
        }
        if (payload.priceHt !== undefined) {
            data.prixUHt = payload.priceHt;
        }
        if (payload.image !== undefined) {
            data.image = payload.image;
        }
        const updated = await this.prisma.produit.update({
            where: { id: BigInt(productId) },
            data,
        });
        return {
            id: Number(updated.id),
            supplierId: updated.supplierId,
            reference: updated.reference,
            category: updated.categorie,
            nameZh: updated.nomCn,
            nameFr: updated.designationFr,
            specification: updated.specification,
            unit: updated.unite,
            priceHt: updated.prixUHt === null ? null : Number(updated.prixUHt),
            image: updated.image,
        };
    }
    async updateProductImage(productId, file, req) {
        if (!file) {
            throw new common_1.BadRequestException('A file is required');
        }
        const existing = await this.prisma.produit.findUnique({
            where: { id: BigInt(productId) },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Product not found');
        }
        const imageUrl = this.buildImageUrl(req, file.filename);
        const updated = await this.prisma.produit.update({
            where: { id: BigInt(productId) },
            data: {
                image: imageUrl,
            },
        });
        return {
            id: Number(updated.id),
            image: updated.image,
        };
    }
    async deleteProduct(productId) {
        try {
            await this.prisma.produit.delete({
                where: { id: BigInt(productId) },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException('Product not found');
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException('Product cannot be deleted because it is linked to existing orders');
            }
            throw error;
        }
        return { success: true, id: productId };
    }
    buildImageUrl(req, fileName) {
        if (this.publicApiBaseUrl) {
            const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
            return `${normalizedBaseUrl}/uploads/images/${fileName}`;
        }
        const host = req.get('host');
        return `${req.protocol}://${host}/uploads/images/${fileName}`;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map