import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UploadCategory } from '@prisma/client';
import { OrdersDocumentService } from './orders-document.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    $transaction: jest.Mock;
    document: { findMany: jest.Mock; deleteMany: jest.Mock };
    produit: { findMany: jest.Mock };
    fournisseur: { findUnique: jest.Mock };
    restaurant: { findUnique: jest.Mock };
    purchaseOrder: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    purchaseOrderItem: {
      createMany: jest.Mock;
      findMany: jest.Mock;
    };
    purchaseReturn: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    purchaseReturnItem: {
      create: jest.Mock;
      createMany: jest.Mock;
      findMany: jest.Mock;
    };
    purchaseReturnItemPhoto: { createMany: jest.Mock };
  };
  let ordersDocumentService: {
    buildOrderFilePath: jest.Mock;
    generateCommandePdf: jest.Mock;
    buildOrderUrl: jest.Mock;
    buildUploadFileUrl: jest.Mock;
    deleteFileIfExists: jest.Mock;
    recoverUtf8: jest.Mock;
    sanitizeLabel: jest.Mock;
    sanitizePlainLabel: jest.Mock;
    makeFrLabel: jest.Mock;
    resolveZhName: jest.Mock;
    hasOrderFile: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma = {
      $transaction: jest.fn(),
      document: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      produit: {
        findMany: jest.fn(),
      },
      fournisseur: {
        findUnique: jest.fn(),
      },
      restaurant: {
        findUnique: jest.fn(),
      },
      purchaseOrder: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      purchaseOrderItem: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      purchaseReturn: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      purchaseReturnItem: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      purchaseReturnItemPhoto: {
        createMany: jest.fn(),
      },
    };

    ordersDocumentService = {
      buildOrderFilePath: jest.fn(
        (fileName: string) => `/tmp/orders/${fileName}`,
      ),
      generateCommandePdf: jest.fn().mockResolvedValue(undefined),
      buildOrderUrl: jest.fn(
        (
          req: { protocol: string; get: (name: string) => string | undefined },
          orderId: number,
        ) => `${req.protocol}://${req.get('host')}/orders/${orderId}/commande`,
      ),
      buildUploadFileUrl: jest.fn(
        (
          req: { protocol: string; get: (name: string) => string | undefined },
          category: UploadCategory,
          fileName: string,
        ) =>
          `${req.protocol}://${req.get('host')}/uploads/${category}/${fileName}`,
      ),
      deleteFileIfExists: jest.fn(),
      recoverUtf8: jest.fn((value: string | null | undefined) => value ?? ''),
      sanitizeLabel: jest.fn((value: string | null | undefined) => {
        const safeValue = (value ?? '').trim();
        return safeValue || '-';
      }),
      sanitizePlainLabel: jest.fn((value: string | null | undefined) => {
        const safeValue = (value ?? '').trim();
        return safeValue || '-';
      }),
      makeFrLabel: jest.fn((value: string) => value),
      resolveZhName: jest.fn(
        (
          snapshotZh: string | null | undefined,
          productZh: string | null | undefined,
        ) => snapshotZh ?? productZh ?? '-',
      ),
      hasOrderFile: jest.fn().mockReturnValue(true),
    };

    service = new OrdersService(
      prisma as never,
      ordersDocumentService as unknown as OrdersDocumentService,
    );
  });

  it('rolls back order creation when PDF generation fails and cleans up the file', async () => {
    const tx = {
      purchaseOrder: {
        create: jest.fn().mockResolvedValue({
          id: 41,
          createdAt: new Date('2026-03-20T10:00:00.000Z'),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      purchaseOrderItem: {
        createMany: jest.fn().mockResolvedValue(undefined),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
    prisma.produit.findMany.mockResolvedValue([
      {
        id: BigInt(2),
        supplierId: 7,
        prixUHt: 12.5,
        nomCn: 'Produit CN',
        designationFr: 'Produit FR',
        specification: '1kg',
        unite: 'piece',
        categorie: 'fresh',
      },
    ]);
    prisma.fournisseur.findUnique.mockResolvedValue({
      id: 7,
      nom: 'Supplier',
    });
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 5,
      name: 'Restaurant',
      address: '12 Rue Exemple',
    });

    ordersDocumentService.generateCommandePdf.mockRejectedValue(
      new Error('PDF failed'),
    );

    await expect(
      service.createOrder(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        {
          deliveryDate: '2026-03-20',
          items: [{ productId: 2, quantity: 3 }],
        },
        {
          protocol: 'https',
          get: jest.fn(),
        },
      ),
    ).rejects.toThrow('PDF failed');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.purchaseOrder.create).toHaveBeenCalledTimes(1);
    expect(tx.purchaseOrder.update).toHaveBeenCalledTimes(1);
    expect(tx.purchaseOrderItem.createMany).toHaveBeenCalledTimes(1);
    expect(ordersDocumentService.deleteFileIfExists).toHaveBeenCalledWith(
      expect.stringContaining('.pdf'),
    );
  });

  it('uses the selected specification slot when creating an order', async () => {
    const tx = {
      purchaseOrder: {
        create: jest.fn().mockResolvedValue({
          id: 52,
          createdAt: new Date('2026-03-21T10:00:00.000Z'),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      purchaseOrderItem: {
        createMany: jest.fn().mockResolvedValue(undefined),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
    prisma.produit.findMany.mockResolvedValue([
      {
        id: BigInt(2),
        supplierId: 7,
        prixUHt: 12.5,
        prixUHt2: 20,
        prixUHt3: null,
        nomCn: 'Produit CN',
        designationFr: 'Produit FR',
        specification: '1kg',
        specification2: '2kg',
        specification3: null,
        unite: 'piece',
        unite2: 'box',
        unite3: null,
        categorie: 'fresh',
      },
    ]);
    prisma.fournisseur.findUnique.mockResolvedValue({
      id: 7,
      nom: 'Supplier',
    });
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 5,
      name: 'Restaurant',
      address: '12 Rue Exemple',
    });

    await expect(
      service.createOrder(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        {
          deliveryDate: '2026-03-21',
          items: [{ productId: 2, quantity: 2, specificationSlot: 2 }],
        },
        {
          protocol: 'https',
          get: jest.fn((name: string) =>
            name === 'host' ? 'api.example.com' : undefined,
          ),
        },
      ),
    ).resolves.toMatchObject({
      id: 52,
      totalItems: 2,
      totalAmount: 40,
    });

    expect(tx.purchaseOrderItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: BigInt(2),
          specificationSlot: 2,
          specification: '2kg',
          unit: 'box',
          unitPriceHt: 20,
          lineTotal: 40,
        }),
      ],
    });
    expect(ordersDocumentService.generateCommandePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            specification: '2kg',
            unit: 'box',
            unitPrice: 20,
            lineTotal: 40,
          }),
        ],
      }),
    );
  });

  it('filters listed orders by the requested restaurant within regional scope', async () => {
    prisma.purchaseOrder.findMany.mockResolvedValue([
      {
        id: 31,
        number: 'PO-20260415-0031',
        supplierId: 7,
        supplier: { id: 7, nom: 'Supplier' },
        restaurant: { id: 5, name: 'Lille' },
        createdByUser: {
          id: 12,
          name: 'Alice',
          email: 'alice@example.com',
        },
        deliveryDate: new Date('2026-04-15T00:00:00.000Z'),
        deliveryAddress: '5 Rue Lille',
        totalItems: 8,
        totalAmount: 125.5,
        createdAt: new Date('2026-04-14T09:00:00.000Z'),
      },
    ]);

    const result = await service.listOrders(
      {
        id: 9,
        role: 'REGIONAL_MANAGER',
        employeeLevel: 'L6_MA',
        restaurantId: 2,
        managedRestaurantIds: [2, 5],
      },
      {
        protocol: 'https',
        get: jest.fn((name: string) =>
          name === 'host' ? 'api.example.com' : undefined,
        ),
      },
      {
        restaurantId: 5,
      },
    );

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith({
      where: { restaurantId: 5 },
      include: {
        supplier: {
          select: {
            id: true,
            nom: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(result).toMatchObject([
      {
        id: 31,
        restaurantId: 5,
        restaurantName: 'Lille',
        createdBy: {
          id: 12,
          name: 'Alice',
          email: 'alice@example.com',
        },
      },
    ]);
  });

  it('rejects listing orders outside the regional manager scope', async () => {
    await expect(
      service.listOrders(
        {
          id: 9,
          role: 'REGIONAL_MANAGER',
          employeeLevel: 'L6_MA',
          restaurantId: 2,
          managedRestaurantIds: [2, 5],
        },
        {
          protocol: 'https',
          get: jest.fn(),
        },
        {
          restaurantId: 7,
        },
      ),
    ).rejects.toThrow(
      new ForbiddenException('Requested restaurant is outside your scope'),
    );

    expect(prisma.purchaseOrder.findMany).not.toHaveBeenCalled();
  });

  it('allows admins to list orders for any requested restaurant', async () => {
    prisma.purchaseOrder.findMany.mockResolvedValue([]);

    await service.listOrders(
      {
        id: 1,
        role: 'ADMIN',
        employeeLevel: null,
        restaurantId: 9,
      },
      {
        protocol: 'https',
        get: jest.fn(),
      },
      {
        restaurantId: 3,
      },
    );

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith({
      where: { restaurantId: 3 },
      include: {
        supplier: {
          select: {
            id: true,
            nom: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('includes zero-quantity supplier catalog rows when supplier requires full order templates', async () => {
    const tx = {
      purchaseOrder: {
        create: jest.fn().mockResolvedValue({
          id: 53,
          createdAt: new Date('2026-03-22T10:00:00.000Z'),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      purchaseOrderItem: {
        createMany: jest.fn().mockResolvedValue(undefined),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
    prisma.produit.findMany
      .mockResolvedValueOnce([
        {
          id: BigInt(2),
          supplierId: 7,
          prixUHt: 12.5,
          prixUHt2: null,
          prixUHt3: null,
          nomCn: 'Produit CN',
          designationFr: 'Produit FR',
          specification: '1kg',
          specification2: null,
          specification3: null,
          unite: 'piece',
          unite2: null,
          unite3: null,
          categorie: 'fresh',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: BigInt(2),
          supplierId: 7,
          prixUHt: 12.5,
          prixUHt2: null,
          prixUHt3: null,
          nomCn: 'Produit CN',
          designationFr: 'Produit FR',
          specification: '1kg',
          specification2: null,
          specification3: null,
          unite: 'piece',
          unite2: null,
          unite3: null,
          categorie: 'fresh',
        },
        {
          id: BigInt(9),
          supplierId: 7,
          prixUHt: 8,
          prixUHt2: null,
          prixUHt3: null,
          nomCn: 'Produit bonus',
          designationFr: 'Produit Bonus',
          specification: '500g',
          specification2: null,
          specification3: null,
          unite: 'bag',
          unite2: null,
          unite3: null,
          categorie: 'fresh',
        },
      ]);
    prisma.fournisseur.findUnique.mockResolvedValue({
      id: 7,
      nom: 'Supplier',
      includeAllProductsInOrder: true,
    });
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 5,
      name: 'Restaurant',
      address: '12 Rue Exemple',
    });

    await expect(
      service.createOrder(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        {
          deliveryDate: '2026-03-22',
          items: [{ productId: 2, quantity: 3, specificationSlot: 1 }],
        },
        {
          protocol: 'https',
          get: jest.fn((name: string) =>
            name === 'host' ? 'api.example.com' : undefined,
          ),
        },
      ),
    ).resolves.toMatchObject({
      id: 53,
      totalItems: 3,
      totalAmount: 37.5,
    });

    expect(tx.purchaseOrderItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: BigInt(2),
          quantity: 3,
          lineTotal: 37.5,
        }),
        expect.objectContaining({
          productId: BigInt(9),
          quantity: 0,
          lineTotal: 0,
        }),
      ],
    });
    expect(ordersDocumentService.generateCommandePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            nameZh: 'Produit CN',
            quantity: 3,
          }),
          expect.objectContaining({
            nameZh: 'Produit bonus',
            quantity: 0,
            lineTotal: 0,
          }),
        ],
      }),
    );
  });

  it('rejects order creation when a multi-spec product is missing specificationSlot', async () => {
    prisma.produit.findMany.mockResolvedValue([
      {
        id: BigInt(2),
        supplierId: 7,
        prixUHt: 12.5,
        prixUHt2: 20,
        prixUHt3: null,
        nomCn: 'Produit CN',
        designationFr: 'Produit FR',
        specification: '1kg',
        specification2: '2kg',
        specification3: null,
        unite: 'piece',
        unite2: 'box',
        unite3: null,
        categorie: 'fresh',
      },
    ]);
    prisma.fournisseur.findUnique.mockResolvedValue({
      id: 7,
      nom: 'Supplier',
    });
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 5,
      name: 'Restaurant',
      address: '12 Rue Exemple',
    });

    await expect(
      service.createOrder(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        {
          deliveryDate: '2026-03-21',
          items: [{ productId: 2, quantity: 2 }],
        },
        {
          protocol: 'https',
          get: jest.fn(),
        },
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'Item specificationSlot is required for products with multiple specifications',
      ),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects actors without restaurant assignment before opening a transaction', async () => {
    await expect(
      service.createOrder(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: null,
        },
        {
          deliveryDate: '2026-03-20',
          items: [{ productId: 2, quantity: 3 }],
        },
        {
          protocol: 'https',
          get: jest.fn(),
        },
      ),
    ).rejects.toThrow(
      new BadRequestException('User must be assigned to a restaurant'),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('builds a return draft with remaining quantities', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 19,
      number: 'PO-20260324-0019',
      supplierId: 7,
      restaurantId: 5,
      deliveryDate: new Date('2026-03-24T00:00:00.000Z'),
      supplier: {
        id: 7,
        nom: 'Supplier',
      },
      items: [
        {
          id: 44,
          productId: BigInt(2),
          quantity: 5,
          nameZh: '青菜',
          nameFr: 'Legume',
          unit: 'kg',
          category: 'fresh',
        },
      ],
    });
    prisma.purchaseReturnItem.findMany.mockResolvedValue([
      {
        purchaseOrderItemId: 44,
        quantity: 2,
      },
    ]);

    await expect(
      service.getOrderReturnDraft(19, {
        id: 8,
        role: 'MANAGER',
        restaurantId: 5,
      }),
    ).resolves.toMatchObject({
      orderId: 19,
      orderNumber: 'PO-20260324-0019',
      items: [
        expect.objectContaining({
          purchaseOrderItemId: 44,
          orderedQuantity: 5,
          returnedQuantity: 2,
          remainingQuantity: 3,
        }),
      ],
    });
  });

  it('rejects a return quantity that exceeds the remaining quantity', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 19,
      number: 'PO-20260324-0019',
      supplierId: 7,
      restaurantId: 5,
      supplier: {
        id: 7,
        nom: 'Supplier',
      },
      items: [
        {
          id: 44,
          productId: BigInt(2),
          quantity: 5,
          nameZh: '青菜',
          nameFr: 'Legume',
          unit: 'kg',
          category: 'fresh',
        },
      ],
    });
    prisma.purchaseReturnItem.findMany.mockResolvedValue([
      {
        purchaseOrderItemId: 44,
        quantity: 4,
      },
    ]);

    await expect(
      service.createOrderReturn(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        {
          orderId: 19,
          reason: 'Produit abime',
          items: [{ purchaseOrderItemId: 44, quantity: 2 }],
        },
      ),
    ).rejects.toThrow(
      new BadRequestException('Return quantity exceeds remaining quantity'),
    );
  });

  it('creates return item photo links for uploaded return evidence', async () => {
    const tx = {
      purchaseReturn: {
        create: jest.fn().mockResolvedValue({
          id: 27,
          createdAt: new Date('2026-03-24T14:00:00.000Z'),
        }),
      },
      purchaseReturnItem: {
        create: jest.fn().mockResolvedValue({
          id: 301,
        }),
      },
      purchaseReturnItemPhoto: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 19,
      number: 'PO-20260324-0019',
      supplierId: 7,
      restaurantId: 5,
      supplier: {
        id: 7,
        nom: 'Supplier',
      },
      items: [
        {
          id: 44,
          productId: BigInt(2),
          quantity: 5,
          nameZh: '青菜',
          nameFr: 'Legume',
          unit: 'kg',
          category: 'fresh',
        },
      ],
    });
    prisma.purchaseReturnItem.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([
      {
        id: 91,
        mediaType: 'image',
        module: 'MANAGEMENT',
        section: 'ORDER_RETURNS',
      },
      {
        id: 92,
        mediaType: 'image',
        module: 'MANAGEMENT',
        section: 'ORDER_RETURNS',
      },
    ]);

    await expect(
      service.createOrderReturn(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        {
          orderId: 19,
          reason: 'Produit abime',
          notes: 'Carton humide',
          items: [
            {
              purchaseOrderItemId: 44,
              quantity: 2,
              photoDocumentIds: [91, 92],
            },
          ],
        },
      ),
    ).resolves.toMatchObject({
      id: 27,
      orderId: 19,
      orderNumber: 'PO-20260324-0019',
      totalItems: 2,
    });

    expect(prisma.document.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [91, 92],
        },
      },
      select: {
        id: true,
        mediaType: true,
        module: true,
        section: true,
      },
    });
    expect(tx.purchaseReturnItem.create).toHaveBeenCalledTimes(1);
    expect(tx.purchaseReturnItemPhoto.createMany).toHaveBeenCalledWith({
      data: [
        {
          purchaseReturnItemId: 301,
          documentId: 91,
        },
        {
          purchaseReturnItemId: 301,
          documentId: 92,
        },
      ],
    });
  });

  it('includes return photo URLs in the return summary response', async () => {
    prisma.purchaseReturn.findMany.mockResolvedValue([
      {
        id: 18,
        purchaseOrderId: 19,
        supplierId: 7,
        restaurantId: 5,
        reason: 'Produit abime',
        notes: 'Carton humide',
        totalItems: 2,
        createdAt: new Date('2026-03-24T14:00:00.000Z'),
        purchaseOrder: {
          id: 19,
          number: 'PO-20260324-0019',
          deliveryDate: new Date('2026-03-24T00:00:00.000Z'),
        },
        supplier: {
          id: 7,
          nom: 'Supplier',
        },
        restaurant: {
          id: 5,
          name: 'Restaurant',
        },
        items: [
          {
            quantity: 2,
            nameZh: '青菜',
            nameFr: 'Legume',
            unit: 'kg',
            photos: [
              {
                document: {
                  id: 91,
                  fileName: 'return-photo-1.jpg',
                  originalName: 'return-photo-1.jpg',
                  category: 'images',
                },
              },
            ],
          },
        ],
      },
    ]);

    await expect(
      service.listOrderReturns(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        {
          protocol: 'https',
          get: jest.fn((name: string) =>
            name === 'host' ? 'api.example.com' : undefined,
          ),
        },
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 18,
        orderNumber: 'PO-20260324-0019',
        items: [
          expect.objectContaining({
            quantity: 2,
            photos: [
              {
                documentId: 91,
                originalName: 'return-photo-1.jpg',
                fileUrl:
                  'https://api.example.com/uploads/images/return-photo-1.jpg',
              },
            ],
          }),
        ],
      }),
    ]);
  });

  it('rejects deleting an order that already has returns', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 19,
      restaurantId: 5,
      bonFileName: 'commande-19.pdf',
    });
    prisma.purchaseReturn.findMany.mockResolvedValue([{ id: 3 }]);

    await expect(
      service.deleteOrder(19, {
        id: 8,
        role: 'MANAGER',
        restaurantId: 5,
      }),
    ).rejects.toThrow(
      new BadRequestException('Order with returns cannot be deleted'),
    );

    expect(prisma.purchaseOrder.delete).not.toHaveBeenCalled();
  });

  it('filters zero-quantity order rows out of top-product analytics', async () => {
    prisma.fournisseur.findUnique.mockResolvedValue({
      id: 7,
      nom: 'Supplier',
    });
    prisma.purchaseOrderItem.findMany.mockResolvedValue([]);

    await expect(
      service.getTopOrderedProductsBySupplier(
        {
          id: 8,
          role: 'MANAGER',
          restaurantId: 5,
        },
        7,
        '2026-03',
      ),
    ).resolves.toEqual([]);

    const purchaseOrderItemFindManyCalls = prisma.purchaseOrderItem.findMany
      .mock.calls as Array<[unknown]>;

    expect(purchaseOrderItemFindManyCalls[0]?.[0]).toMatchObject({
      where: {
        quantity: {
          gt: 0,
        },
      },
    });
  });

  it('deletes a purchase return and cleans up attached photo documents', async () => {
    prisma.purchaseReturn.findUnique.mockResolvedValue({
      id: 18,
      restaurantId: 5,
      items: [
        {
          photos: [
            {
              document: {
                id: 91,
                fileName: 'return-photo-1.jpg',
                category: 'images',
              },
            },
            {
              document: {
                id: 92,
                fileName: 'return-photo-2.jpg',
                category: 'images',
              },
            },
          ],
        },
      ],
    });
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof prisma) => Promise<unknown>) =>
        callback(prisma as never),
    );
    prisma.purchaseReturn.delete.mockResolvedValue({ id: 18 });
    prisma.document.deleteMany.mockResolvedValue({ count: 2 });

    await expect(
      service.deleteOrderReturn(18, {
        id: 8,
        role: 'MANAGER',
        restaurantId: 5,
      }),
    ).resolves.toEqual({ success: true, id: 18 });

    expect(prisma.purchaseReturn.delete).toHaveBeenCalledWith({
      where: { id: 18 },
    });
    expect(prisma.document.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [91, 92],
        },
      },
    });
    expect(ordersDocumentService.deleteFileIfExists).toHaveBeenCalledTimes(2);
  });

  it('treats deleting a missing purchase return as a successful no-op', async () => {
    prisma.purchaseReturn.findUnique.mockResolvedValue(null);

    await expect(
      service.deleteOrderReturn(4, {
        id: 8,
        role: 'MANAGER',
        restaurantId: 5,
      }),
    ).resolves.toEqual({ success: true, id: 4 });

    expect(prisma.purchaseReturn.delete).not.toHaveBeenCalled();
    expect(prisma.document.deleteMany).not.toHaveBeenCalled();
    expect(ordersDocumentService.deleteFileIfExists).not.toHaveBeenCalled();
  });
});
