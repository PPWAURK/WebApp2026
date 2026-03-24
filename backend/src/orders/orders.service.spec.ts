import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { OrdersService } from './orders.service';

jest.mock('fs', () => ({
  createWriteStream: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    $transaction: jest.Mock;
    produit: { findMany: jest.Mock };
    fournisseur: { findUnique: jest.Mock };
    restaurant: { findUnique: jest.Mock };
    purchaseOrder: { findUnique: jest.Mock; delete: jest.Mock };
    purchaseReturn: { create: jest.Mock; findMany: jest.Mock };
    purchaseReturnItem: { createMany: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(true);

    prisma = {
      $transaction: jest.fn(),
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
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      purchaseReturn: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      purchaseReturnItem: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new OrdersService(prisma as never);
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

    jest
      .spyOn(service as never, 'generateCommandePdf')
      .mockRejectedValue(new Error('PDF failed'));

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
    expect(unlinkSync).toHaveBeenCalledWith(
      expect.stringContaining('commande-'),
    );
    expect(mkdirSync).not.toHaveBeenCalled();
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
});
