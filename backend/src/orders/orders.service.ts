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

@Injectable()
export class OrdersService {
  private readonly storageRoot =
    process.env.STORAGE_ROOT_PATH ?? join(process.cwd(), 'uploads');
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
  private readonly ordersDir = join(this.storageRoot, 'orders');

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
    this.ensureCanManageOrders(actor);

    if (!actor.restaurantId) {
      throw new BadRequestException('User must be assigned to a restaurant');
    }

    const deliveryDate = this.parseDeliveryDate(payload.deliveryDate);

    if (!payload.items?.length) {
      throw new BadRequestException('At least one item is required');
    }

    const normalizedItems = payload.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const distinctProductIds = Array.from(
      new Set(normalizedItems.map((item) => item.productId)),
    );

    const products = await this.prisma.produit.findMany({
      where: {
        id: {
          in: distinctProductIds.map((id) => BigInt(id)),
        },
      },
    });

    if (products.length !== distinctProductIds.length) {
      throw new BadRequestException('Some selected products do not exist');
    }

    const productById = new Map(products.map((product) => [Number(product.id), product]));

    const supplierIds = Array.from(new Set(products.map((product) => product.supplierId)));
    if (supplierIds.length !== 1) {
      throw new BadRequestException('Order must include products from one supplier only');
    }

    const supplierId = supplierIds[0];

    const supplier = await this.prisma.fournisseur.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: actor.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const preparedItems = normalizedItems.map((item) => {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('Item quantity must be a positive integer');
      }

      const product = productById.get(item.productId);
      if (!product) {
        throw new BadRequestException('Selected product does not exist');
      }

      const unitPrice = Number(product.prixUHt ?? 0);
      const lineTotal = unitPrice * item.quantity;

      return {
        product,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const totalItems = preparedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = preparedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const createdOrder = await this.prisma.purchaseOrder.create({
      data: {
        number: `PO-TMP-${Date.now()}`,
        supplierId,
        restaurantId: actor.restaurantId,
        createdByUserId: actor.id,
        deliveryDate,
        deliveryAddress: restaurant.address,
        totalItems,
        totalAmount,
        bonFileName: 'pending.pdf',
      },
    });

    const orderNumber = this.buildOrderNumber(createdOrder.id, createdOrder.createdAt);
    const bonFileName = `bon-commande-${orderNumber}.pdf`;

    await this.prisma.purchaseOrder.update({
      where: { id: createdOrder.id },
      data: {
        number: orderNumber,
        bonFileName,
      },
    });

    await this.prisma.purchaseOrderItem.createMany({
      data: preparedItems.map((item) => ({
        purchaseOrderId: createdOrder.id,
        productId: item.product.id,
        supplierId,
        quantity: item.quantity,
        unitPriceHt: item.unitPrice,
        lineTotal: item.lineTotal,
        nameZh: item.product.nomCn,
        nameFr: item.product.designationFr,
        unit: item.product.unite,
        category: item.product.categorie,
      })),
    });

    await this.generateBonPdf({
      filePath: join(this.ordersDir, bonFileName),
      orderNumber,
      supplierName: supplier.nom,
      restaurantName: restaurant.name,
      deliveryDate: payload.deliveryDate,
      deliveryAddress: restaurant.address,
      items: preparedItems.map((item) => ({
        name: item.product.designationFr ?? item.product.nomCn,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      totalItems,
      totalAmount,
    });

    return {
      id: createdOrder.id,
      number: orderNumber,
      supplierId,
      supplierName: supplier.nom,
      deliveryDate: payload.deliveryDate,
      deliveryAddress: restaurant.address,
      totalItems,
      totalAmount,
      bonUrl: this.buildBonUrl(req, createdOrder.id),
      createdAt: createdOrder.createdAt,
    };
  }

  async listOrders(
    actor: Actor,
    req: { protocol: string; get: (name: string) => string | undefined },
  ) {
    this.ensureCanManageOrders(actor);

    const orders = await this.prisma.purchaseOrder.findMany({
      where:
        actor.role === 'ADMIN'
          ? undefined
          : {
              restaurantId: actor.restaurantId ?? -1,
            },
      include: {
        supplier: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      id: order.id,
      number: order.number,
      supplierId: order.supplierId,
      supplierName: order.supplier.nom,
      deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
      deliveryAddress: order.deliveryAddress,
      totalItems: order.totalItems,
      totalAmount: Number(order.totalAmount),
      bonUrl: this.buildBonUrl(req, order.id),
      createdAt: order.createdAt,
    }));
  }

  async resolveBonFilePath(orderId: number, actor: Actor) {
    this.ensureCanManageOrders(actor);

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        restaurantId: true,
        bonFileName: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (actor.role !== 'ADMIN' && order.restaurantId !== actor.restaurantId) {
      throw new ForbiddenException('Order does not belong to your restaurant');
    }

    const fullPath = join(this.ordersDir, order.bonFileName);
    if (!existsSync(fullPath)) {
      throw new NotFoundException('Purchase order file not found');
    }

    return fullPath;
  }

  private ensureCanManageOrders(actor: Actor) {
    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw new ForbiddenException('Only ADMIN and MANAGER can access orders');
    }
  }

  private parseDeliveryDate(raw: string) {
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      throw new BadRequestException('deliveryDate must match YYYY-MM-DD');
    }

    const parsed = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('deliveryDate is invalid');
    }

    return parsed;
  }

  private buildOrderNumber(orderId: number, createdAt: Date) {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const day = String(createdAt.getDate()).padStart(2, '0');
    const paddedId = String(orderId).padStart(4, '0');
    return `PO-${year}${month}${day}-${paddedId}`;
  }

  private buildBonUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    orderId: number,
  ) {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/orders/${orderId}/bon`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/orders/${orderId}/bon`;
  }

  private async generateBonPdf(input: {
    filePath: string;
    orderNumber: string;
    supplierName: string;
    restaurantName: string;
    deliveryDate: string;
    deliveryAddress: string;
    items: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>;
    totalItems: number;
    totalAmount: number;
  }) {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const doc = new PDFDocument({ margin: 36 });
      const stream = createWriteStream(input.filePath);

      doc.pipe(stream);

      doc.fontSize(18).text('Bon de commande');
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Numero: ${input.orderNumber}`);
      doc.text(`Fournisseur: ${input.supplierName}`);
      doc.text(`Etablissement: ${input.restaurantName}`);
      doc.text(`Date de livraison: ${input.deliveryDate}`);
      doc.text(`Adresse de livraison: ${input.deliveryAddress}`);

      doc.moveDown(1);
      doc.fontSize(12).text('Produits');
      doc.moveDown(0.4);

      input.items.forEach((item) => {
        doc
          .fontSize(10)
          .text(
            `${item.name} | Qte: ${item.quantity} | PU HT: ${item.unitPrice.toFixed(2)} | Ligne: ${item.lineTotal.toFixed(2)}`,
          );
      });

      doc.moveDown(1);
      doc.fontSize(11).text(`Articles total: ${input.totalItems}`);
      doc.fontSize(12).text(`Montant total HT: ${input.totalAmount.toFixed(2)}`);

      doc.end();

      stream.on('finish', () => resolvePromise());
      stream.on('error', (error) => rejectPromise(error));
    });
  }
}
