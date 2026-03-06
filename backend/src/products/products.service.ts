import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    return products.map((product) => this.serializeProduct(product));
  }

  async createProduct(payload: {
    supplierId: number;
    reference?: string | null;
    category: string;
    nameZh: string;
    nameFr?: string | null;
    specification?: string | null;
    unit?: string | null;
    priceHt?: number | null;
    image?: string | null;
  }) {
    if (!Number.isInteger(payload.supplierId) || payload.supplierId <= 0) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    await this.ensureSupplierExists(payload.supplierId);

    const normalizedCategory = payload.category.trim();
    if (!normalizedCategory) {
      throw new BadRequestException('category cannot be empty');
    }

    const normalizedNameZh = payload.nameZh.trim();
    if (!normalizedNameZh) {
      throw new BadRequestException('nameZh cannot be empty');
    }

    if (
      payload.priceHt !== undefined &&
      payload.priceHt !== null &&
      !Number.isFinite(payload.priceHt)
    ) {
      throw new BadRequestException('priceHt must be a finite number or null');
    }

    const created = await this.prisma.produit.create({
      data: {
        supplierId: payload.supplierId,
        reference: this.normalizeOptionalText(payload.reference),
        categorie: normalizedCategory,
        nomCn: normalizedNameZh,
        designationFr: this.normalizeOptionalText(payload.nameFr),
        specification: this.normalizeOptionalText(payload.specification),
        unite: this.normalizeOptionalText(payload.unit),
        prixUHt: payload.priceHt ?? null,
        image: this.normalizeOptionalText(payload.image),
      },
    });

    return this.serializeProduct(created);
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

      await this.ensureSupplierExists(payload.supplierId);
      data.supplierId = payload.supplierId;
    }

    if (payload.reference !== undefined) {
      data.reference = this.normalizeOptionalText(payload.reference);
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
      data.designationFr = this.normalizeOptionalText(payload.nameFr);
    }

    if (payload.specification !== undefined) {
      data.specification = this.normalizeOptionalText(payload.specification);
    }

    if (payload.unit !== undefined) {
      data.unite = this.normalizeOptionalText(payload.unit);
    }

    if (payload.priceHt !== undefined) {
      if (payload.priceHt !== null && !Number.isFinite(payload.priceHt)) {
        throw new BadRequestException(
          'priceHt must be a finite number or null',
        );
      }

      data.prixUHt = payload.priceHt;
    }

    if (payload.image !== undefined) {
      data.image = this.normalizeOptionalText(payload.image);
    }

    const updated = await this.prisma.produit.update({
      where: { id: BigInt(productId) },
      data,
    });

    return this.serializeProduct(updated);
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
    const normalizedPrefix = (process.env.API_PREFIX ?? '').replace(
      /^\/+|\/+$/g,
      '',
    );

    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      const normalizedPrefixEscaped = normalizedPrefix.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      const hasPrefixAlready =
        normalizedPrefix.length > 0 &&
        new RegExp(`/${normalizedPrefixEscaped}$`).test(normalizedBaseUrl);

      const baseUrlWithPrefix =
        normalizedPrefix.length > 0 && !hasPrefixAlready
          ? `${normalizedBaseUrl}/${normalizedPrefix}`
          : normalizedBaseUrl;

      return `${baseUrlWithPrefix}/uploads/images/${fileName}`;
    }

    const host = req.get('host');
    const prefixedUploadsPath = normalizedPrefix
      ? `/${normalizedPrefix}/uploads/images/${fileName}`
      : `/uploads/images/${fileName}`;

    return `${req.protocol}://${host}${prefixedUploadsPath}`;
  }

  private normalizeOptionalText(value: string | null | undefined) {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private async ensureSupplierExists(supplierId: number) {
    const supplier = await this.prisma.fournisseur.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }
  }

  private serializeProduct(product: {
    id: bigint;
    supplierId: number;
    reference: string | null;
    categorie: string;
    nomCn: string;
    designationFr: string | null;
    specification: string | null;
    unite: string | null;
    prixUHt: Prisma.Decimal | null;
    image: string | null;
  }) {
    return {
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
    };
  }
}
