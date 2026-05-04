import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    produit: {
      count: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    fournisseur: {
      findUnique: jest.Mock;
    };
    productCategory: {
      count: jest.Mock;
      create: jest.Mock;
      createMany: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const productRecord = {
    id: BigInt(12),
    supplierId: 3,
    productCategoryId: null,
    productCategory: null,
    reference: 'REF-12',
    categorie: 'sec',
    nomCn: '测试商品',
    designationFr: 'Produit test',
    specification: '1kg',
    unite: 'piece',
    prixUHt: new Prisma.Decimal(4.5),
    specification2: null,
    unite2: null,
    prixUHt2: null,
    specification3: null,
    unite3: null,
    prixUHt3: null,
    image: null,
    isActive: true,
  };

  const categoryRecord = {
    id: 5,
    supplierId: 3,
    nameZh: '蔬菜水果',
    nameFr: 'Fruits & legumes',
    sortOrder: 10,
    isPreset: true,
  };

  beforeEach(() => {
    prisma = {
      produit: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      fournisseur: {
        findUnique: jest.fn(),
      },
      productCategory: {
        count: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ProductsService(prisma as never);
  });

  it('lists only active products by default', async () => {
    prisma.produit.findMany.mockResolvedValue([productRecord]);

    const result = await service.listProducts();

    expect(prisma.produit.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      include: { productCategory: true },
      orderBy: { id: 'asc' },
    });
    expect(result).toMatchObject([
      {
        id: 12,
        isActive: true,
      },
    ]);
  });

  it('can include inactive products for admin management screens', async () => {
    prisma.produit.findMany.mockResolvedValue([
      {
        ...productRecord,
        isActive: false,
      },
    ]);

    const result = await service.listProducts({ includeInactive: true });

    expect(prisma.produit.findMany).toHaveBeenCalledWith({
      where: undefined,
      include: { productCategory: true },
      orderBy: { id: 'asc' },
    });
    expect(result[0]).toMatchObject({
      id: 12,
      isActive: false,
    });
  });

  it('updates product availability', async () => {
    prisma.produit.update.mockResolvedValue({
      ...productRecord,
      isActive: false,
    });

    const result = await service.updateProductAvailability(12, false);

    expect(prisma.produit.update).toHaveBeenCalledWith({
      where: { id: BigInt(12) },
      data: { isActive: false },
    });
    expect(result).toMatchObject({
      id: 12,
      isActive: false,
    });
  });

  it('returns not found when updating availability for a missing product', async () => {
    prisma.produit.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('missing', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );

    await expect(service.updateProductAvailability(404, false)).rejects.toThrow(
      new NotFoundException('Product not found'),
    );
  });

  it('creates default categories before listing supplier categories', async () => {
    prisma.fournisseur.findUnique.mockResolvedValue({ id: 3 });
    prisma.productCategory.count.mockResolvedValue(0);
    prisma.productCategory.createMany.mockResolvedValue({ count: 9 });
    prisma.productCategory.findMany.mockResolvedValue([categoryRecord]);

    const result = await service.listProductCategories(3);

    expect(prisma.productCategory.createMany).toHaveBeenCalledWith({
      data: [
        {
          supplierId: 3,
          nameZh: '蔬菜水果',
          nameFr: 'Fruits & legumes',
          sortOrder: 10,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '肉类海鲜',
          nameFr: 'Viandes & poissons',
          sortOrder: 20,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '冷冻冷藏',
          nameFr: 'Surgeles & frais',
          sortOrder: 30,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '干货粮油',
          nameFr: 'Epicerie seche',
          sortOrder: 40,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '调料酱料',
          nameFr: 'Condiments',
          sortOrder: 50,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '饮料酒水',
          nameFr: 'Boissons',
          sortOrder: 60,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '包材耗材',
          nameFr: 'Emballages',
          sortOrder: 70,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '清洁用品',
          nameFr: 'Hygiene',
          sortOrder: 80,
          isPreset: true,
        },
        {
          supplierId: 3,
          nameZh: '其他',
          nameFr: 'Autres',
          sortOrder: 90,
          isPreset: true,
        },
      ],
      skipDuplicates: true,
    });
    expect(result).toEqual([categoryRecord]);
  });

  it('blocks deleting a category that is used by products', async () => {
    prisma.productCategory.findUnique.mockResolvedValue({ id: 5 });
    prisma.produit.count.mockResolvedValue(1);

    await expect(service.deleteProductCategory(5)).rejects.toThrow(
      new BadRequestException(
        'Product category cannot be deleted while products use it',
      ),
    );
    expect(prisma.productCategory.delete).not.toHaveBeenCalled();
  });

  it('creates a product with categoryId and resolves legacy category', async () => {
    prisma.fournisseur.findUnique.mockResolvedValue({ id: 3 });
    prisma.productCategory.findUnique.mockResolvedValue(categoryRecord);

    prisma.produit.create.mockResolvedValue({
      ...productRecord,
      productCategoryId: 5,
      categorie: 'fresh',
    });

    prisma.produit.findUnique.mockResolvedValue({
      ...productRecord,
      productCategoryId: 5,
      productCategory: categoryRecord,
      categorie: 'fresh',
    });

    const result = await service.createProduct({
      supplierId: 3,
      categoryId: 5,
      nameZh: '上海青',
    });

    expect(prisma.produit.create).toHaveBeenCalledWith({
      data: {
        supplierId: 3,
        productCategoryId: 5,
        reference: null,
        categorie: 'fresh',
        nomCn: '上海青',
        designationFr: null,
        specification: null,
        unite: null,
        prixUHt: null,
        specification2: null,
        unite2: null,
        prixUHt2: null,
        specification3: null,
        unite3: null,
        prixUHt3: null,
        image: null,
      },
    });

    expect(result).toMatchObject({
      categoryId: 5,
      category: categoryRecord.nameZh,
      categoryNameZh: categoryRecord.nameZh,
    });
  });
});
