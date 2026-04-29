import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    produit: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  const productRecord = {
    id: BigInt(12),
    supplierId: 3,
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

  beforeEach(() => {
    prisma = {
      produit: {
        findMany: jest.fn(),
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

    await expect(
      service.updateProductAvailability(404, false),
    ).rejects.toThrow(new NotFoundException('Product not found'));
  });
});
