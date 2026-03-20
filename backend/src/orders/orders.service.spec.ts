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
});
