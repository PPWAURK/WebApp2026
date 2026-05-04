import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ProductPayload = {
  supplierId: number;
  categoryId?: number | null;
  reference?: string | null;
  category?: string;
  nameZh: string;
  nameFr?: string | null;
  specification?: string | null;
  unit?: string | null;
  priceHt?: number | null;
  specification2?: string | null;
  unit2?: string | null;
  priceHt2?: number | null;
  specification3?: string | null;
  unit3?: string | null;
  priceHt3?: number | null;
  image?: string | null;
};

type UpdateProductPayload = {
  supplierId?: number;
  categoryId?: number | null;
  reference?: string | null;
  category?: string;
  nameZh?: string;
  nameFr?: string | null;
  specification?: string | null;
  unit?: string | null;
  priceHt?: number | null;
  specification2?: string | null;
  unit2?: string | null;
  priceHt2?: number | null;
  specification3?: string | null;
  unit3?: string | null;
  priceHt3?: number | null;
  image?: string | null;
};

type ListProductsOptions = {
  includeInactive?: boolean;
};

type ProductRecord = {
  id: bigint;
  supplierId: number;
  productCategoryId: number | null;
  productCategory?: ProductCategoryRecord | null;
  reference: string | null;
  categorie: string;
  nomCn: string;
  designationFr: string | null;
  specification: string | null;
  unite: string | null;
  prixUHt: Prisma.Decimal | null;
  specification2: string | null;
  unite2: string | null;
  prixUHt2: Prisma.Decimal | null;
  specification3: string | null;
  unite3: string | null;
  prixUHt3: Prisma.Decimal | null;
  image: string | null;
  isActive: boolean;
};

type ProductCategoryRecord = {
  id: number;
  supplierId: number;
  nameZh: string;
  nameFr: string;
  sortOrder: number;
  isPreset: boolean;
};

type ProductCategoryPayload = {
  supplierId: number;
  nameZh: string;
  nameFr: string;
};

type UpdateProductCategoryPayload = {
  nameZh?: string;
  nameFr?: string;
  sortOrder?: number;
};

const PRODUCT_CATEGORY_PRESETS = [
  { nameZh: '蔬菜水果', nameFr: 'Fruits & legumes', sortOrder: 10 },
  { nameZh: '肉类海鲜', nameFr: 'Viandes & poissons', sortOrder: 20 },
  { nameZh: '冷冻冷藏', nameFr: 'Surgeles & frais', sortOrder: 30 },
  { nameZh: '干货粮油', nameFr: 'Epicerie seche', sortOrder: 40 },
  { nameZh: '调料酱料', nameFr: 'Condiments', sortOrder: 50 },
  { nameZh: '饮料酒水', nameFr: 'Boissons', sortOrder: 60 },
  { nameZh: '包材耗材', nameFr: 'Emballages', sortOrder: 70 },
  { nameZh: '清洁用品', nameFr: 'Hygiene', sortOrder: 80 },
  { nameZh: '其他', nameFr: 'Autres', sortOrder: 90 },
] as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;

  async listProducts(options: ListProductsOptions = {}) {
    const products = await this.prisma.produit.findMany({
      where: options.includeInactive ? undefined : { isActive: true },
      include: {
        productCategory: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return products.map((product) => this.serializeProduct(product));
  }

  async listProductCategories(supplierId: number) {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    await this.ensureSupplierExists(supplierId);
    await this.ensureDefaultCategoriesForSupplier(supplierId);

    const categories = await this.prisma.productCategory.findMany({
      where: { supplierId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return categories.map((category) =>
      this.serializeProductCategory(category),
    );
  }

  async createProductCategory(payload: ProductCategoryPayload) {
    if (!Number.isInteger(payload.supplierId) || payload.supplierId <= 0) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    await this.ensureSupplierExists(payload.supplierId);

    const nameZh = payload.nameZh.trim();
    const nameFr = payload.nameFr.trim();
    if (!nameZh || !nameFr) {
      throw new BadRequestException('category names cannot be empty');
    }

    const lastCategory = await this.prisma.productCategory.findFirst({
      where: { supplierId: payload.supplierId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const created = await this.prisma.productCategory.create({
      data: {
        supplierId: payload.supplierId,
        nameZh,
        nameFr,
        sortOrder: (lastCategory?.sortOrder ?? 0) + 10,
        isPreset: false,
      },
    });

    return this.serializeProductCategory(created);
  }

  async updateProductCategory(
    categoryId: number,
    payload: UpdateProductCategoryPayload,
  ) {
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw new BadRequestException('categoryId must be a positive integer');
    }

    const existing = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      throw new NotFoundException('Product category not found');
    }

    const data: {
      nameZh?: string;
      nameFr?: string;
      sortOrder?: number;
    } = {};

    if (payload.nameZh !== undefined) {
      const nameZh = payload.nameZh.trim();
      if (!nameZh) {
        throw new BadRequestException('nameZh cannot be empty');
      }
      data.nameZh = nameZh;
    }

    if (payload.nameFr !== undefined) {
      const nameFr = payload.nameFr.trim();
      if (!nameFr) {
        throw new BadRequestException('nameFr cannot be empty');
      }
      data.nameFr = nameFr;
    }

    if (payload.sortOrder !== undefined) {
      if (!Number.isInteger(payload.sortOrder)) {
        throw new BadRequestException('sortOrder must be an integer');
      }
      data.sortOrder = payload.sortOrder;
    }

    const updated = await this.prisma.productCategory.update({
      where: { id: categoryId },
      data,
    });

    if (data.nameZh !== undefined && data.nameZh !== existing.nameZh) {
      await this.prisma.produit.updateMany({
        where: { productCategoryId: categoryId },
        data: { categorie: data.nameZh },
      });
    }

    return this.serializeProductCategory(updated);
  }

  async deleteProductCategory(categoryId: number) {
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw new BadRequestException('categoryId must be a positive integer');
    }

    const existing = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Product category not found');
    }

    const linkedProducts = await this.prisma.produit.count({
      where: { productCategoryId: categoryId },
    });

    if (linkedProducts > 0) {
      throw new BadRequestException(
        'Product category cannot be deleted while products use it',
      );
    }

    await this.prisma.productCategory.delete({
      where: { id: categoryId },
    });

    return { success: true, id: categoryId };
  }

  async createProduct(payload: ProductPayload) {
    if (!Number.isInteger(payload.supplierId) || payload.supplierId <= 0) {
      throw new BadRequestException('supplierId must be a positive integer');
    }

    await this.ensureSupplierExists(payload.supplierId);

    const resolvedCategory = await this.resolveProductCategory({
      category: payload.category,
      categoryId: payload.categoryId,
      supplierId: payload.supplierId,
    });

    const normalizedNameZh = payload.nameZh.trim();
    if (!normalizedNameZh) {
      throw new BadRequestException('nameZh cannot be empty');
    }

    this.validateSpecificationPayload(payload);

    const created = await this.prisma.produit.create({
      data: {
        supplierId: payload.supplierId,
        productCategoryId: resolvedCategory.categoryId,
        reference: this.normalizeOptionalText(payload.reference),
        categorie: resolvedCategory.categoryName,
        nomCn: normalizedNameZh,
        designationFr: this.normalizeOptionalText(payload.nameFr),
        specification: this.normalizeOptionalText(payload.specification),
        unite: this.normalizeOptionalText(payload.unit),
        prixUHt: payload.priceHt ?? null,
        specification2: this.normalizeOptionalText(payload.specification2),
        unite2: this.normalizeOptionalText(payload.unit2),
        prixUHt2: payload.priceHt2 ?? null,
        specification3: this.normalizeOptionalText(payload.specification3),
        unite3: this.normalizeOptionalText(payload.unit3),
        prixUHt3: payload.priceHt3 ?? null,
        image: this.normalizeOptionalText(payload.image),
      },
    });

    return this.serializeProduct(
      await this.findProductForSerialization(Number(created.id)),
    );
  }

  async updateProduct(productId: number, payload: UpdateProductPayload) {
    const existing = await this.prisma.produit.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true, supplierId: true },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const data: {
      supplierId?: number;
      productCategoryId?: number | null;
      reference?: string | null;
      categorie?: string;
      nomCn?: string;
      designationFr?: string | null;
      specification?: string | null;
      unite?: string | null;
      prixUHt?: number | null;
      specification2?: string | null;
      unite2?: string | null;
      prixUHt2?: number | null;
      specification3?: string | null;
      unite3?: string | null;
      prixUHt3?: number | null;
      image?: string | null;
    } = {};

    this.validateSpecificationPayload(payload);
    const nextSupplierId = payload.supplierId ?? existing.supplierId;

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

    if (payload.categoryId !== undefined || payload.category !== undefined) {
      const resolvedCategory = await this.resolveProductCategory({
        category: payload.category,
        categoryId: payload.categoryId,
        supplierId: nextSupplierId,
      });

      data.productCategoryId = resolvedCategory.categoryId;
      data.categorie = resolvedCategory.categoryName;
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
      data.prixUHt = payload.priceHt;
    }

    if (payload.specification2 !== undefined) {
      data.specification2 = this.normalizeOptionalText(payload.specification2);
    }

    if (payload.unit2 !== undefined) {
      data.unite2 = this.normalizeOptionalText(payload.unit2);
    }

    if (payload.priceHt2 !== undefined) {
      data.prixUHt2 = payload.priceHt2;
    }

    if (payload.specification3 !== undefined) {
      data.specification3 = this.normalizeOptionalText(payload.specification3);
    }

    if (payload.unit3 !== undefined) {
      data.unite3 = this.normalizeOptionalText(payload.unit3);
    }

    if (payload.priceHt3 !== undefined) {
      data.prixUHt3 = payload.priceHt3;
    }

    if (payload.image !== undefined) {
      data.image = this.normalizeOptionalText(payload.image);
    }

    const updated = await this.prisma.produit.update({
      where: { id: BigInt(productId) },
      data,
    });

    return this.serializeProduct(
      await this.findProductForSerialization(Number(updated.id)),
    );
  }

  async updateProductAvailability(productId: number, isActive: boolean) {
    const updated = await this.prisma.produit
      .update({
        where: { id: BigInt(productId) },
        data: { isActive },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Product not found');
        }

        throw error;
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

  private validateSpecificationPayload(payload: {
    priceHt?: number | null;
    priceHt2?: number | null;
    priceHt3?: number | null;
    specification2?: string | null;
    specification3?: string | null;
  }) {
    const priceFields = [
      { key: 'priceHt', value: payload.priceHt },
      { key: 'priceHt2', value: payload.priceHt2 },
      { key: 'priceHt3', value: payload.priceHt3 },
    ];

    for (const field of priceFields) {
      if (field.value !== undefined && field.value !== null) {
        if (!Number.isFinite(field.value)) {
          throw new BadRequestException(
            `${field.key} must be a finite number or null`,
          );
        }
      }
    }

    const specification2 = this.normalizeOptionalText(payload.specification2);
    const specification3 = this.normalizeOptionalText(payload.specification3);

    if (specification3 && !specification2) {
      throw new BadRequestException(
        'specification2 is required before specification3',
      );
    }
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

  private async ensureDefaultCategoriesForSupplier(supplierId: number) {
    const existingCount = await this.prisma.productCategory.count({
      where: { supplierId },
    });

    if (existingCount > 0) {
      return;
    }

    await this.prisma.productCategory.createMany({
      data: PRODUCT_CATEGORY_PRESETS.map((preset) => ({
        supplierId,
        nameZh: preset.nameZh,
        nameFr: preset.nameFr,
        sortOrder: preset.sortOrder,
        isPreset: true,
      })),
      skipDuplicates: true,
    });
  }

  private async resolveProductCategory(input: {
    supplierId: number;
    categoryId?: number | null;
    category?: string;
  }): Promise<{ categoryId: number | null; categoryName: string }> {
    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: input.categoryId },
      });

      if (!category || category.supplierId !== input.supplierId) {
        throw new BadRequestException(
          'categoryId must belong to the selected supplier',
        );
      }

      return {
        categoryId: category.id,
        categoryName: category.nameZh,
      };
    }

    const categoryName = input.category?.trim();
    if (!categoryName) {
      throw new BadRequestException('category cannot be empty');
    }

    return {
      categoryId: null,
      categoryName,
    };
  }

  private async findProductForSerialization(productId: number) {
    const product = await this.prisma.produit.findUnique({
      where: { id: BigInt(productId) },
      include: { productCategory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private serializeProduct(product: ProductRecord) {
    const specificationSlots = [
      {
        slot: 1,
        specification: product.specification,
        unit: product.unite,
        priceHt: this.serializeNullableDecimal(product.prixUHt),
      },
      {
        slot: 2,
        specification: product.specification2,
        unit: product.unite2,
        priceHt: this.serializeNullableDecimal(product.prixUHt2),
      },
      {
        slot: 3,
        specification: product.specification3,
        unit: product.unite3,
        priceHt: this.serializeNullableDecimal(product.prixUHt3),
      },
    ].filter((slot) => slot.specification);
    const requiresSpecificationSelection = specificationSlots.some(
      (slot) => slot.slot !== 1,
    );

    return {
      id: Number(product.id),
      supplierId: product.supplierId,
      categoryId: product.productCategoryId,
      reference: product.reference,
      category: product.categorie,
      categoryNameZh: product.productCategory?.nameZh ?? product.categorie,
      categoryNameFr: product.productCategory?.nameFr ?? product.categorie,
      categorySortOrder: product.productCategory?.sortOrder ?? null,
      nameZh: product.nomCn,
      nameFr: product.designationFr,
      specification: product.specification,
      unit: product.unite,
      priceHt: this.serializeNullableDecimal(product.prixUHt),
      specification2: product.specification2,
      unit2: product.unite2,
      priceHt2: this.serializeNullableDecimal(product.prixUHt2),
      specification3: product.specification3,
      unit3: product.unite3,
      priceHt3: this.serializeNullableDecimal(product.prixUHt3),
      requiresSpecificationSelection,
      specifications: specificationSlots,
      image: product.image,
      isActive: product.isActive,
    };
  }

  private serializeNullableDecimal(value: Prisma.Decimal | null) {
    return value === null ? null : Number(value);
  }

  private serializeProductCategory(category: ProductCategoryRecord) {
    return {
      id: category.id,
      supplierId: category.supplierId,
      nameZh: category.nameZh,
      nameFr: category.nameFr,
      sortOrder: category.sortOrder,
      isPreset: category.isPreset,
    };
  }
}
