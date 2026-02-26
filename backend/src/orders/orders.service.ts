import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} from 'fs';
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
    lineTotal: number;
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
  private readonly logoCandidatePaths = [
    join(process.cwd(), 'assets', 'ZHAO', '2-01.png'),
    join(this.storageRoot, 'assets', 'ZHAO-元素element', 'logo', '1.png'),
  ];
  private readonly redFontDecorationDir = join(
    process.cwd(),
    'assets',
    'ZHAO-元素element',
    '文字',
    '红色字体',
  );
  private readonly decorationImagePaths = this.resolveDecorationImagePaths();
  private readonly cjkFontCandidatePaths = [
    join(
      process.cwd(),
      'assets',
      'fonts',
      'Noto_Sans_SC',
      'static',
      'NotoSansSC-Regular.ttf',
    ),
    join(process.cwd(), 'assets', 'fonts', 'NotoSansSC-Regular.ttf'),
    join(this.storageRoot, 'assets', 'fonts', 'NotoSansSC-Regular.ttf'),
    '/System/Library/Fonts/Hiragino Sans GB.ttc',
    '/System/Library/Fonts/STHeiti Medium.ttc',
  ];
  private readonly cjkFontPath = this.cjkFontCandidatePaths.find((path) =>
    existsSync(path),
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
        throw new BadRequestException(
          'Item quantity must be a positive integer',
        );
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

    const productById = new Map(
      products.map((product) => [Number(product.id), product]),
    );
    const supplierIds = Array.from(
      new Set(products.map((product) => product.supplierId)),
    );
    if (supplierIds.length !== 1) {
      throw new BadRequestException(
        'Order must include products from one supplier only',
      );
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

    const totalItems = preparedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalAmount = preparedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

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

    const orderNumber = this.buildOrderNumber(
      createdOrder.id,
      createdOrder.createdAt,
    );
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
      items: preparedItems.map((item) => {
        const frRaw = this.recoverUtf8(
          item.product.designationFr ?? item.product.nomCn,
        );
        const nameFr =
          this.sanitizeLabel(this.makeFrLabel(frRaw)) ||
          this.sanitizeLabel(frRaw);

        const zhRaw = this.recoverUtf8(item.product.nomCn);
        const nameZh = this.sanitizeLabel(zhRaw);

        // ⚠️ unité: ne passe PAS par recoverUtf8 (on évite les heuristiques)
        const unit = this.sanitizeLabel(item.product.unite?.trim() || '-');

        return {
          nameFr,
          nameZh,
          unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        };
      }),
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
      items: order.items.map((item) => {
        const frRaw = this.recoverUtf8(
          item.product.designationFr ?? item.nameZh,
        );
        const nameFr =
          this.sanitizeLabel(this.makeFrLabel(frRaw)) ||
          this.sanitizeLabel(frRaw);

        const nameZh = this.sanitizeLabel(
          this.resolveZhName(item.nameZh, item.product.nomCn),
        );

        // unité: priorité à product.unite puis snapshot item.unit
        // et surtout: pas de recoverUtf8 ici
        const unitCandidate =
          (item.product.unite ?? '').trim() || (item.unit ?? '').trim() || '-';
        const unit = this.sanitizeLabel(unitCandidate);

        return {
          nameFr,
          nameZh,
          unit,
          quantity: item.quantity,
          unitPrice: Number(item.unitPriceHt),
          lineTotal: Number(item.quantity) * Number(item.unitPriceHt),
        };
      }),
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

  async deleteOrder(orderId: number, actor: Actor) {
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

    await this.prisma.purchaseOrder.delete({
      where: { id: orderId },
    });

    const filePath = join(this.ordersDir, order.bonFileName);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        // Best-effort cleanup only: order deletion should still succeed.
      }
    }

    return {
      success: true,
      id: orderId,
    };
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

      this.drawRandomDecorations(doc);
      this.drawHeader(doc, input);
      this.drawOrderMeta(doc, input);
      this.drawItemsTable(doc, input);
      this.drawFooter(doc);

      doc.end();

      stream.on('finish', () => resolvePromise());
      stream.on('error', (error) => rejectPromise(error));
    });
  }

  private drawHeader(doc: PdfDoc, input: CommandePdfInput) {
    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const titleY = doc.y;

    doc
      .rect(left, titleY, right - left, 46)
      .fillColor(this.pdfColors.primary)
      .fill();

    doc
      .fillColor(this.pdfColors.white)
      .fontSize(18)
      .text('Commande', left, titleY + 13, {
        width: right - left,
        align: 'center',
      });

    const logoPath = this.logoCandidatePaths.find((path) => existsSync(path));
    if (logoPath) {
      doc.image(logoPath, left + 8, titleY + 6, {
        fit: [80, 34],
      });
    }

    doc
      .fontSize(10)
      .text(`Numero: ${input.orderNumber}`, right - 170, titleY + 6, {
        width: 160,
        align: 'right',
      })
      .text(
        `Emission: ${new Date().toISOString().slice(0, 10)}`,
        right - 170,
        titleY + 20,
        {
          width: 160,
          align: 'right',
        },
      );

    doc.moveDown(2.8);
    doc.fillColor(this.pdfColors.text);
  }

  private drawOrderMeta(doc: PdfDoc, input: CommandePdfInput) {
    const left = doc.page.margins.left;
    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const blockY = doc.y;

    doc
      .roundedRect(left, blockY, contentWidth, 74, 8)
      .lineWidth(1)
      .strokeColor(this.pdfColors.border)
      .stroke();

    doc
      .fillColor(this.pdfColors.primaryDark)
      .fontSize(11)
      .text(`Fournisseur: ${input.supplierName}`, left + 12, blockY + 10)
      .text(`Etablissement: ${input.restaurantName}`, left + 12, blockY + 27)
      .text(`Date de livraison: ${input.deliveryDate}`, left + 12, blockY + 44);

    doc
      .fillColor(this.pdfColors.text)
      .fontSize(10)
      .text(
        `Adresse: ${input.deliveryAddress}`,
        left + contentWidth / 2,
        blockY + 27,
        {
          width: contentWidth / 2 - 12,
        },
      );

    doc.y = blockY + 86;
  }

  private drawItemsTable(doc: PdfDoc, input: CommandePdfInput) {
    const left = doc.page.margins.left;
    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colProduct = Math.floor(contentWidth * 0.46);
    const colOrderUnit = Math.floor(contentWidth * 0.12);
    const colQty = Math.floor(contentWidth * 0.12);
    const colUnitPrice = contentWidth - colProduct - colOrderUnit - colQty;
    const rowHeight = 36;

    const drawHeaderRow = () => {
      const y = doc.y;
      doc
        .rect(left, y, contentWidth, rowHeight)
        .fillColor(this.pdfColors.primary)
        .fill();
      doc
        .fillColor(this.pdfColors.white)
        .fontSize(10)
        .text('Produit FR / ZH', left + 8, y + 7, { width: colProduct - 12 })
        .text('Unite', left + colProduct + 4, y + 7, {
          width: colOrderUnit - 8,
          align: 'center',
        })
        .text('Qte', left + colProduct + colOrderUnit + 4, y + 7, {
          width: colQty - 8,
          align: 'center',
        })
        .text('PU HT', left + colProduct + colOrderUnit + colQty + 4, y + 7, {
          width: colUnitPrice - 8,
          align: 'right',
        });
      doc.y = y + rowHeight;
    };

    const ensureSpace = (requiredHeight: number) => {
      const bottomLimit = doc.page.height - doc.page.margins.bottom - 90;
      if (doc.y + requiredHeight > bottomLimit) {
        doc.addPage();
        this.drawRandomDecorations(doc);
        drawHeaderRow();
      }
    };

    drawHeaderRow();

    input.items.forEach((item, index) => {
      ensureSpace(rowHeight);
      const y = doc.y;

      const productNameFr = this.truncateText(
        this.sanitizeLabel(item.nameFr),
        44,
      );
      const productNameZh = this.truncateText(
        this.sanitizeLabel(item.nameZh),
        44,
      );
      const orderUnit = this.sanitizeLabel(item.unit?.trim() || '-');

      if (index % 2 === 1) {
        doc
          .rect(left, y, contentWidth, rowHeight)
          .fillColor(this.pdfColors.rowAlt)
          .fill();
      }

      // FR
      doc
        .fillColor(this.pdfColors.text)
        .font('Helvetica')
        .fontSize(10)
        .text(productNameFr, left + 8, y + 6, {
          width: colProduct - 12,
        });

      // ZH (police CJK)
      if (this.cjkFontPath) {
        doc.font(this.cjkFontPath);
      }
      doc
        .fontSize(9)
        .fillColor(this.pdfColors.muted)
        .text(productNameZh, left + 8, y + 20, {
          width: colProduct - 12,
        });

      // Unité: police selon contenu (sinon "箱" ne s'affiche pas)
      if (this.cjkFontPath && this.containsCjk(orderUnit)) {
        doc.font(this.cjkFontPath);
      } else {
        doc.font('Helvetica');
      }

      doc
        .fillColor(this.pdfColors.text)
        .fontSize(10)
        .text(orderUnit, left + colProduct + 4, y + 12, {
          width: colOrderUnit - 8,
          align: 'center',
        });

      // Le reste en Helvetica
      doc
        .font('Helvetica')
        .fillColor(this.pdfColors.text)
        .fontSize(10)
        .text(
          String(item.quantity),
          left + colProduct + colOrderUnit + 4,
          y + 12,
          {
            width: colQty - 8,
            align: 'center',
          },
        )
        .text(
          item.unitPrice.toFixed(2),
          left + colProduct + colOrderUnit + colQty + 4,
          y + 12,
          {
            width: colUnitPrice - 8,
            align: 'right',
          },
        );

      doc
        .moveTo(left, y + rowHeight)
        .lineTo(left + contentWidth, y + rowHeight)
        .strokeColor(this.pdfColors.border)
        .lineWidth(0.6)
        .stroke();

      doc.y = y + rowHeight;
    });

    doc.moveDown(0.8);
  }

  private drawTotals(doc: PdfDoc, input: CommandePdfInput) {
    const cardWidth = 220;
    const x = doc.page.width - doc.page.margins.right - cardWidth;
    const y = doc.y;

    doc
      .roundedRect(x, y, cardWidth, 54, 8)
      .lineWidth(1)
      .strokeColor(this.pdfColors.primary)
      .stroke();

    doc
      .fillColor(this.pdfColors.primaryDark)
      .fontSize(10)
      .text(`Articles total: ${input.totalItems}`, x + 10, y + 12, {
        width: cardWidth - 20,
      })
      .fontSize(12)
      .text(
        `Montant total HT: ${input.totalAmount.toFixed(2)}`,
        x + 10,
        y + 30,
        {
          width: cardWidth - 20,
        },
      );

    doc.y = y + 68;
  }

  private drawFooter(doc: PdfDoc) {
    const footerY = doc.page.height - doc.page.margins.bottom - 20;
    doc
      .fontSize(9)
      .fillColor(this.pdfColors.muted)
      .text(
        'Document genere automatiquement par la plateforme.',
        doc.page.margins.left,
        footerY,
        {
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: 'center',
        },
      );
  }

  private truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength - 1)}...`;
  }

  private drawRandomDecorations(doc: PdfDoc) {
    if (!this.decorationImagePaths.length) {
      return;
    }

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 24;
    const minSize = 44;
    const maxSize = 110;
    const imageCount = 2 + Math.floor(Math.random() * 3);

    doc.save();
    doc.opacity(0.1 + Math.random() * 0.08);

    for (let index = 0; index < imageCount; index += 1) {
      const size = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
      const maxX = Math.max(margin, pageWidth - margin - size);
      const maxY = Math.max(margin, pageHeight - margin - size);
      const x = margin + Math.random() * Math.max(1, maxX - margin);
      const y = margin + Math.random() * Math.max(1, maxY - margin);
      const imagePath =
        this.decorationImagePaths[
          Math.floor(Math.random() * this.decorationImagePaths.length)
        ];

      doc.image(imagePath, x, y, {
        fit: [size, size],
      });
    }

    doc.restore();
  }

  private resolveDecorationImagePaths() {
    if (!existsSync(this.redFontDecorationDir)) {
      return [] as string[];
    }

    return readdirSync(this.redFontDecorationDir)
      .filter((name) => name.toLowerCase().endsWith('.png'))
      .map((name) => join(this.redFontDecorationDir, name));
  }

  // ✅ Nouveau: fabrique un vrai libellé FR depuis un champ parfois "mixé"
  private makeFrLabel(value: string) {
    const withoutCjk = value.replace(/[\u3400-\u9FFF]/g, '');
    // enlève les tokens d'unité/poids en fin (ex: "箱*8KG", "*8KG", "8KG", "10L", etc.)
    const withoutTrailingPack = withoutCjk.replace(
      /(\s*[xX×]?\s*\*?\s*\d+(\.\d+)?\s*(KG|G|L|ML|PCS|PC|CTN|BOT|BIDON|SAC))\s*$/i,
      '',
    );
    return withoutTrailingPack.replace(/\s+/g, ' ').trim();
  }

  // ✅ Corrigé: ne tente plus utf16 sur de l'ASCII
  private recoverUtf8(value: string | null | undefined) {
    const safeValue = (value ?? '').trim();
    if (!safeValue) return '';

    if (this.containsCjk(safeValue)) return safeValue;

    // ASCII pur => on ne touche pas
    if (!/[\u0080-\u00FF]/.test(safeValue)) {
      return safeValue;
    }

    const binaryBuffer = Buffer.from(safeValue, 'latin1');

    const decodedUtf8 = binaryBuffer.toString('utf8').trim();
    if (this.containsCjk(decodedUtf8)) return decodedUtf8;

    const decodedUtf16Be = this.decodeUtf16Be(binaryBuffer).trim();
    if (
      this.containsCjk(decodedUtf16Be) &&
      !this.hasControlChars(decodedUtf16Be)
    ) {
      return decodedUtf16Be;
    }

    const decodedUtf16Le = binaryBuffer.toString('utf16le').trim();
    if (
      this.containsCjk(decodedUtf16Le) &&
      !this.hasControlChars(decodedUtf16Le)
    ) {
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
    // ici on garde recoverUtf8 pour les champs "texte", mais pas utilisé pour unit
    const safeValue = this.recoverUtf8(value);
    if (!safeValue) return '-';

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
