import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async listSuppliers() {
    const suppliers = await this.prisma.fournisseur.findMany({
      orderBy: {
        nom: 'asc',
      },
    });

    return suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.nom,
    }));
  }

  async createSupplier(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException('name is required');
    }

    const created = await this.prisma.fournisseur.create({
      data: {
        nom: trimmedName,
      },
    });

    return {
      id: created.id,
      name: created.nom,
    };
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
      await this.prisma.fournisseur.delete({
        where: { id: supplierId },
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
}
