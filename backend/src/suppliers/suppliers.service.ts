import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SupplierRecord = {
  id: number;
  nom: string;
  sortOrder: number;
  includeAllProductsInOrder: boolean;
};

type PrismaExecutor = Prisma.TransactionClient | PrismaService;

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async listSuppliers() {
    const suppliers = await this.listSupplierRecords(this.prisma);
    return suppliers.map((supplier) => this.toSupplierItem(supplier));
  }

  async createSupplier(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException('name is required');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const lastSupplier = await tx.fournisseur.findFirst({
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
        select: { sortOrder: true },
      });

      return tx.fournisseur.create({
        data: {
          nom: trimmedName,
          sortOrder: (lastSupplier?.sortOrder ?? 0) + 1,
          includeAllProductsInOrder: false,
        },
        select: {
          id: true,
          nom: true,
          sortOrder: true,
          includeAllProductsInOrder: true,
        },
      });
    });

    return this.toSupplierItem(created);
  }

  async updateSupplierOrderSettings(
    supplierId: number,
    payload: { includeAllProductsInOrder: boolean },
  ) {
    const existing = await this.prisma.fournisseur.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    const updated = await this.prisma.fournisseur.update({
      where: { id: supplierId },
      data: {
        includeAllProductsInOrder: payload.includeAllProductsInOrder,
      },
      select: {
        id: true,
        nom: true,
        sortOrder: true,
        includeAllProductsInOrder: true,
      },
    });

    return this.toSupplierItem(updated);
  }

  async reorderSuppliers(supplierIdsRaw: unknown) {
    if (!Array.isArray(supplierIdsRaw)) {
      throw new BadRequestException('supplierIds must be an array');
    }

    const supplierIds = supplierIdsRaw.map((entry) =>
      typeof entry === 'number' ? entry : Number.NaN,
    );

    if (
      supplierIds.some(
        (supplierId) => !Number.isInteger(supplierId) || supplierId <= 0,
      )
    ) {
      throw new BadRequestException(
        'supplierIds must contain positive integers only',
      );
    }

    if (new Set(supplierIds).size !== supplierIds.length) {
      throw new BadRequestException('supplierIds must be unique');
    }

    const existingSuppliers = await this.prisma.fournisseur.findMany({
      select: { id: true },
    });

    if (existingSuppliers.length !== supplierIds.length) {
      throw new BadRequestException(
        'supplierIds must include every supplier exactly once',
      );
    }

    const existingIds = new Set(
      existingSuppliers.map((supplier) => supplier.id),
    );
    if (supplierIds.some((supplierId) => !existingIds.has(supplierId))) {
      throw new BadRequestException(
        'supplierIds must include every supplier exactly once',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const [index, supplierId] of supplierIds.entries()) {
        await tx.fournisseur.update({
          where: { id: supplierId },
          data: { sortOrder: index + 1 },
        });
      }
    });

    return this.listSuppliers();
  }

  async deleteSupplier(supplierId: number) {
    const existing = await this.prisma.fournisseur.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    const [linkedProductsCount, linkedOrdersCount] = await Promise.all([
      this.prisma.produit.count({
        where: { supplierId },
      }),
      this.prisma.purchaseOrder.count({
        where: { supplierId },
      }),
    ]);

    if (linkedProductsCount > 0) {
      throw new BadRequestException(
        'Supplier cannot be deleted because it still has products',
      );
    }

    if (linkedOrdersCount > 0) {
      throw new BadRequestException(
        'Supplier cannot be deleted because it is linked to existing orders',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.fournisseur.delete({
          where: { id: supplierId },
        });

        await this.normalizeSupplierSortOrder(tx);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Supplier cannot be deleted because it is linked to existing orders',
        );
      }

      throw error;
    }

    return {
      success: true,
      id: supplierId,
    };
  }

  private async listSupplierRecords(prisma: PrismaExecutor) {
    return prisma.fournisseur.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nom: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        nom: true,
        sortOrder: true,
        includeAllProductsInOrder: true,
      },
    });
  }

  private async normalizeSupplierSortOrder(prisma: Prisma.TransactionClient) {
    const suppliers = await this.listSupplierRecords(prisma);

    for (const [index, supplier] of suppliers.entries()) {
      const nextSortOrder = index + 1;
      if (supplier.sortOrder === nextSortOrder) {
        continue;
      }

      await prisma.fournisseur.update({
        where: { id: supplier.id },
        data: { sortOrder: nextSortOrder },
      });
    }
  }

  private toSupplierItem(supplier: SupplierRecord) {
    return {
      id: supplier.id,
      name: supplier.nom,
      includeAllProductsInOrder: supplier.includeAllProductsInOrder,
    };
  }
}
