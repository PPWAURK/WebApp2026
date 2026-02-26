import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

type Actor = {
  id: number;
  role: string;
  restaurantId: number | null;
};

type CreateOrderPayload = {
  deliveryDate: string;
  items: Array<{ productId: number; quantity: number }>;
};

type PdfDoc = InstanceType<typeof PDFDocument>;

type CommandePdfInput = {
  filePath: string;
  orderNumber: string;
  supplierName: string;
  restaurantName: string;
  deliveryDate: string;
  deliveryAddress: string;
  items: Array<{
    nameFr: string;
    nameZh: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalItems: number;
  totalAmount: number;
};

@Injectable()
export class OrdersService {
  private readonly storageRoot =
    process.env.STORAGE_ROOT_PATH ?? join(process.cwd(), 'uploads');

  private readonly ordersDir = join(this.storageRoot, 'orders');

  private readonly fontPath = join(
    process.cwd(),
    'assets',
    'fonts',
    'Noto_Sans_SC',
    'static',
    'NotoSansSC-Regular.ttf',
  );

  private readonly pdfColors = {
    primary: '#ab1e24',
    primaryDark: '#7f1b21',
    text: '#1f1f1f',
    muted: '#6b6b6b',
    border: '#e4c3c5',
    rowAlt: '#fdf4f5',
    white: '#ffffff',
  };

  constructor(private readonly prisma: PrismaService) {
    if (!existsSync(this.ordersDir)) {
      mkdirSync(this.ordersDir, { recursive: true });
    }
  }

  async createOrder(
    actor: Actor,
    payload: CreateOrderPayload,
    req: { protocol: string; get: (name: string) => string | undefined },
  ) {
    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw new ForbiddenException('Not allowed');
    }

    if (!actor.restaurantId) {
      throw new BadRequestException('User must be assigned to a restaurant');
    }

    const deliveryDate = new Date(`${payload.deliveryDate}T00:00:00.000Z`);

    const products = await this.prisma.produit.findMany({
      where: {
        id: {
          in: payload.items.map((i) => BigInt(i.productId)),
        },
      },
    });

    if (!products.length) {
      throw new BadRequestException('Products not found');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: actor.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const preparedItems = payload.items.map((item) => {
      const product = products.find((p) => Number(p.id) === item.productId);
      if (!product) throw new BadRequestException('Invalid product');

      const unitPrice = Number(product.prixUHt ?? 0);

      return {
        product,
        quantity: item.quantity,
        unitPrice,
      };
    });

    const totalItems = preparedItems.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = preparedItems.reduce(
      (s, i) => s + i.quantity * i.unitPrice,
      0,
    );

    const order = await this.prisma.purchaseOrder.create({
      data: {
        number: `PO-${Date.now()}`,
        supplierId: products[0].supplierId,
        restaurantId: actor.restaurantId,
        createdByUserId: actor.id,
        deliveryDate,
        deliveryAddress: restaurant.address,
        totalItems,
        totalAmount,
        bonFileName: 'pending.pdf',
      },
    });

    const fileName = `commande-${order.id}.pdf`;

    await this.prisma.purchaseOrder.update({
      where: { id: order.id },
      data: { bonFileName: fileName },
    });

    await this.generateCommandePdf({
      filePath: join(this.ordersDir, fileName),
      orderNumber: order.number,
      supplierName: 'Fournisseur',
      restaurantName: restaurant.name,
      deliveryDate: payload.deliveryDate,
      deliveryAddress: restaurant.address,
      items: preparedItems.map((i) => ({
        nameFr: i.product.designationFr ?? '',
        nameZh: i.product.nomCn,
        unit: i.product.unite ?? '-',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      totalItems,
      totalAmount,
    });

    return order;
  }

  private async generateCommandePdf(input: CommandePdfInput) {
    await new Promise<void>((resolve, reject) => {
      if (!existsSync(this.fontPath)) {
        throw new Error('Chinese font not found');
      }

      const doc = new PDFDocument({ margin: 36 });
      doc.registerFont('CJK', this.fontPath);
      doc.font('CJK');

      const stream = createWriteStream(input.filePath);
      doc.pipe(stream);

      doc.fontSize(18).text('Commande', { align: 'center' });
      doc.moveDown();

      doc.fontSize(11).text(`Numero: ${input.orderNumber}`);
      doc.text(`Restaurant: ${input.restaurantName}`);
      doc.text(`Livraison: ${input.deliveryDate}`);
      doc.moveDown();

      input.items.forEach((item) => {
        doc
          .fontSize(10)
          .text(
            `${item.nameFr} / ${item.nameZh} | ${item.quantity} ${item.unit} x ${item.unitPrice.toFixed(
              2,
            )}`,
          );
      });

      doc.moveDown();
      doc.fontSize(12).text(`Total articles: ${input.totalItems}`);
      doc.text(`Total HT: ${input.totalAmount.toFixed(2)}`);

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }
}
