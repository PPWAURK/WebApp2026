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
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
  private readonly ordersDir = join(this.storageRoot, 'orders');
  private readonly cjkFontCandidatePaths = [
    join(process.cwd(), 'assets', 'fonts', 'Noto_Sans_SC', 'static', 'NotoSansSC-Regular.ttf'),
    join(process.cwd(), 'assets', 'fonts', 'NotoSansSC-Regular.ttf'),
    join(this.storageRoot, 'assets', 'fonts', 'NotoSansSC-Regular.ttf'),
    '/System/Library/Fonts/Hiragino Sans GB.ttc',
    '/System/Library/Fonts/STHeiti Medium.ttc',
  ];
  private readonly cjkFontPath = this.cjkFontCandidatePaths.find((path) =>
    existsSync(path),
  );

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

    for (const item of normalizedItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('Item quantity must be a positive integer');
      }
    }

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
    const supplier = await this.prisma.fournisseur.findUnique({ where: { id: supplierId } });
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
    const orderFileName = `commande-${orderNumber}.pdf`;

    await this.prisma.purchaseOrder.update({
      where: { id: createdOrder.id },
      data: {
        number: orderNumber,
        bonFileName: orderFileName,
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

    await this.generateCommandePdf({
      filePath: join(this.ordersDir, orderFileName),
      orderNumber,
      supplierName: supplier.nom,
      restaurantName: restaurant.name,
      deliveryDate: payload.deliveryDate,
      deliveryAddress: restaurant.address,
      items: preparedItems.map((item) => ({
        nameFr: this.sanitizeLabel(
          this.recoverUtf8(item.product.designationFr ?? item.product.nomCn),
        ),
        nameZh: this.sanitizeLabel(this.recoverUtf8(item.product.nomCn)),
        unit: item.product.unite?.trim() ? item.product.unite.trim() : '-',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalItems,
      totalAmount,
    });

    const commandeUrl = this.buildOrderUrl(req, createdOrder.id);

    return {
      id: createdOrder.id,
      number: orderNumber,
      supplierId,
      supplierName: supplier.nom,
      deliveryDate: payload.deliveryDate,
      deliveryAddress: restaurant.address,
      totalItems,
      totalAmount,
      bonUrl: commandeUrl,
      commandeUrl,
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

    return orders.map((order) => {
      const commandeUrl = this.buildOrderUrl(req, order.id);

      return {
        id: order.id,
        number: order.number,
        supplierId: order.supplierId,
        supplierName: order.supplier.nom,
        deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
        deliveryAddress: order.deliveryAddress,
        totalItems: order.totalItems,
        totalAmount: Number(order.totalAmount),
        bonUrl: commandeUrl,
        commandeUrl,
        createdAt: order.createdAt,
      };
    });
  }

  async resolveOrderFilePath(orderId: number, actor: Actor) {
    this.ensureCanManageOrders(actor);

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        supplier: {
          select: {
            nom: true,
          },
        },
        restaurant: {
          select: {
            name: true,
          },
        },
        items: {
          orderBy: {
            id: 'asc',
          },
          select: {
            nameZh: true,
            nameFr: true,
            unit: true,
            quantity: true,
            unitPriceHt: true,
            product: {
              select: {
                nomCn: true,
                designationFr: true,
                unite: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (actor.role !== 'ADMIN' && order.restaurantId !== actor.restaurantId) {
      throw new ForbiddenException('Order does not belong to your restaurant');
    }

    const fullPath = join(this.ordersDir, order.bonFileName);

    await this.generateCommandePdf({
      filePath: fullPath,
      orderNumber: order.number,
      supplierName: order.supplier.nom,
      restaurantName: order.restaurant.name,
      deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((item) => ({
        nameFr: this.sanitizeLabel(
          this.recoverUtf8(item.nameFr ?? item.product.designationFr ?? item.nameZh),
        ),
        nameZh: this.sanitizeLabel(this.resolveZhName(item.nameZh, item.product.nomCn)),
        unit: item.unit?.trim()
          ? item.unit.trim()
          : item.product.unite?.trim()
            ? item.product.unite.trim()
            : '-',
        quantity: item.quantity,
        unitPrice: Number(item.unitPriceHt),
      })),
      totalItems: order.totalItems,
      totalAmount: Number(order.totalAmount),
    });

    if (!existsSync(fullPath)) {
      throw new NotFoundException('Order file not found');
    }

    return fullPath;
  }

  async resolveBonFilePath(orderId: number, actor: Actor) {
    return this.resolveOrderFilePath(orderId, actor);
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

  private buildOrderUrl(
    req: { protocol: string; get: (name: string) => string | undefined },
    orderId: number,
  ) {
    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      return `${normalizedBaseUrl}/orders/${orderId}/commande`;
    }

    const host = req.get('host');
    return `${req.protocol}://${host}/orders/${orderId}/commande`;
  }

  private async generateCommandePdf(input: CommandePdfInput) {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const doc = new PDFDocument({ margin: 36 });
      const stream = createWriteStream(input.filePath);

      doc.pipe(stream);

      if (this.cjkFontPath) {
        doc.registerFont('CJK', this.cjkFontPath);
      }

      doc.fontSize(18).text('Commande', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).text(`Numero: ${input.orderNumber}`);
      doc.text(`Fournisseur: ${input.supplierName}`);
      doc.text(`Etablissement: ${input.restaurantName}`);
      doc.text(`Date de livraison: ${input.deliveryDate}`);
      doc.text(`Adresse: ${input.deliveryAddress}`);
      doc.moveDown();

      input.items.forEach((item) => {
        const fr = this.sanitizeLabel(item.nameFr);
        const zh = this.sanitizeLabel(item.nameZh);
        const lineTotal = item.quantity * item.unitPrice;

        doc.font('Helvetica').fontSize(10).text(`${fr} (${item.unit}) x ${item.quantity}`);
        if (this.cjkFontPath) {
          doc.font('CJK');
        }
        doc.fontSize(10).text(zh);
        doc.font('Helvetica').fontSize(10).text(`PU HT: ${item.unitPrice.toFixed(2)}  Total HT: ${lineTotal.toFixed(2)}`);
        doc.moveDown(0.6);
      });

      doc.moveDown();
      doc.font('Helvetica').fontSize(11).text(`Articles total: ${input.totalItems}`);
      doc.text(`Montant total HT: ${input.totalAmount.toFixed(2)}`);

      doc.end();

      stream.on('finish', () => resolvePromise());
      stream.on('error', (error) => rejectPromise(error));
    });
  }

  private recoverUtf8(value: string | null | undefined) {
    const safeValue = (value ?? '').trim();
    if (!safeValue) {
      return '';
    }

    if (this.containsCjk(safeValue)) {
      return safeValue;
    }

    if (!/[\u0080-\u00FF]/.test(safeValue)) {
      const utf16Recovered = Buffer.from(safeValue, 'latin1').toString('utf16le').trim();
      if (this.containsCjk(utf16Recovered)) {
        return utf16Recovered;
      }

      return safeValue;
    }

    const binaryBuffer = Buffer.from(safeValue, 'latin1');
    const decodedUtf8 = binaryBuffer.toString('utf8').trim();
    if (this.containsCjk(decodedUtf8)) {
      return decodedUtf8;
    }

    const decodedUtf16Be = this.decodeUtf16Be(binaryBuffer).trim();
    if (this.containsCjk(decodedUtf16Be) && !this.hasControlChars(decodedUtf16Be)) {
      return decodedUtf16Be;
    }

    const decodedUtf16Le = binaryBuffer.toString('utf16le').trim();
    if (this.containsCjk(decodedUtf16Le) && !this.hasControlChars(decodedUtf16Le)) {
      return decodedUtf16Le;
    }

    return safeValue;
  }

  private resolveZhName(
    snapshotZh: string | null | undefined,
    productZh: string | null | undefined,
  ) {
    const snapshot = this.recoverUtf8(snapshotZh);
    if (this.containsCjk(snapshot)) {
      return snapshot;
    }

    const current = this.recoverUtf8(productZh);
    if (this.containsCjk(current)) {
      return current;
    }

    return snapshot || current || '-';
  }

  private sanitizeLabel(value: string | null | undefined) {
    const safeValue = this.recoverUtf8(value);
    if (!safeValue) {
      return '-';
    }

    return safeValue
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeUtf16Be(value: Buffer) {
    if (value.length < 2) {
      return '';
    }

    const evenLength = value.length - (value.length % 2);
    const swapped = Buffer.allocUnsafe(evenLength);

    for (let index = 0; index < evenLength; index += 2) {
      swapped[index] = value[index + 1];
      swapped[index + 1] = value[index];
    }

    return swapped.toString('utf16le');
  }

  private hasControlChars(value: string) {
    return /[\x00-\x1F\x7F]/.test(value);
  }

  private containsCjk(value: string) {
    return /[\u3400-\u9FFF]/.test(value);
  }
}
