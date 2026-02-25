import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    const products = await this.prisma.produit.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return products.map((product) => ({
      id: Number(product.id),
      supplierId: product.supplierId,
      reference: product.reference,
      category: product.categorie,
      nameZh: product.nomCn,
      nameFr: product.designationFr,
      unit: product.unite,
      priceHt: product.prixUHt === null ? null : Number(product.prixUHt),
      image: product.image,
    }));
  }
}
