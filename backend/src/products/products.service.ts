import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;

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

  async updateProduct(
    productId: number,
    payload: {
      supplierId?: number;
      reference?: string | null;
      category?: string;
      nameZh?: string;
      nameFr?: string | null;
      specification?: string | null;
      unit?: string | null;
      priceHt?: number | null;
      image?: string | null;
    },
  ) {
    const existing = await this.prisma.produit.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const data: {
      supplierId?: number;
      reference?: string | null;
      categorie?: string;
      nomCn?: string;
      designationFr?: string | null;
      specification?: string | null;
      unite?: string | null;
      prixUHt?: number | null;
      image?: string | null;
    } = {};

    if (payload.supplierId !== undefined) {
      if (!Number.isInteger(payload.supplierId) || payload.supplierId <= 0) {
        throw new BadRequestException('supplierId must be a positive integer');
      }

      data.supplierId = payload.supplierId;
    }

    if (payload.reference !== undefined) {
      data.reference = payload.reference;
    }

    if (payload.category !== undefined) {
      if (!payload.category.trim()) {
        throw new BadRequestException('category cannot be empty');
      }

      data.categorie = payload.category.trim();
    }

    if (payload.nameZh !== undefined) {
      if (!payload.nameZh.trim()) {
        throw new BadRequestException('nameZh cannot be empty');
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

  async updateProductImage(
    productId: number,
    file: Express.Multer.File,
    req: { protocol: string; get: (name: string) => string | undefined },
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const existing = await this.prisma.produit.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
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

  async deleteProduct(productId: number) {
    try {
      await this.prisma.produit.delete({
        where: { id: BigInt(productId) },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Product not found');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Product cannot be deleted because it is linked to existing orders',
        );
      }

      throw error;
    }

    return { success: true, id: productId };
  }

  private buildImageUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    fileName: string,
  ) {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/uploads/images/${fileName}`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/images/${fileName}`;
  }
}
