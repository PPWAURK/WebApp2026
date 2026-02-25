import { BadRequestException, Injectable } from '@nestjs/common';
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
}
