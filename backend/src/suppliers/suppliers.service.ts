import { Injectable } from '@nestjs/common';
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
}
