import { Injectable, Logger } from '@nestjs/common';
import { UploadCategory } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { OrderDocumentInput, OrdersRequestContext } from './orders.types';

type PdfDoc = InstanceType<typeof PDFDocument>;

@Injectable()
export class OrdersDocumentService {
  private readonly logger = new Logger(OrdersDocumentService.name);
  private readonly storageRoot =
    process.env.STORAGE_ROOT_PATH ?? join(process.cwd(), 'uploads');
  private readonly publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
  private readonly ordersDir = join(this.storageRoot, 'orders');
  private readonly logoCandidatePaths = [
    join(process.cwd(), 'assets', 'ZHAO', '2-01.png'),
    join(this.storageRoot, 'assets', 'ZHAO-元素element', 'logo', '1.png'),
  ];
  private readonly pdfBackgroundPath = join(
    process.cwd(),
    'assets',
    'ZHAO',
    'img.png',
  );
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

  constructor() {
    if (!existsSync(this.ordersDir)) {
      mkdirSync(this.ordersDir, { recursive: true });
    }
  }

  buildOrderFilePath(fileName: string): string {
    return join(this.ordersDir, fileName);
  }

  hasOrderFile(filePath: string): boolean {
    return existsSync(filePath);
  }

  buildOrderUrl(req: OrdersRequestContext, orderId: number): string {
    return this.buildApiUrl(req, `/orders/${orderId}/commande`);
  }

  buildUploadFileUrl(
    req: OrdersRequestContext,
    category: UploadCategory,
    fileName: string,
  ): string {
    return this.buildApiUrl(req, `/uploads/${category}/${fileName}`);
  }

  deleteFileIfExists(filePath: string | null): void {
    if (!filePath || !existsSync(filePath)) {
      return;
    }

    try {
      unlinkSync(filePath);
    } catch (error) {
      this.logger.warn(
        `Failed to delete order file during cleanup: ${filePath}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async generateCommandePdf(input: OrderDocumentInput): Promise<void> {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const doc = new PDFDocument({ margin: 36 });
      const stream = createWriteStream(input.filePath);

      doc.pipe(stream);

      this.drawBackground(doc);
      this.drawHeader(doc, input);
      this.drawOrderMeta(doc, input);
      this.drawItemsTable(doc, input);
      this.drawTotals(doc, input);
      this.drawFooter(doc);

      doc.end();

      stream.on('finish', () => resolvePromise());
      stream.on('error', (error) => rejectPromise(error));
    });
  }

  makeFrLabel(value: string): string {
    const withoutCjk = value.replace(/[\u3400-\u9FFF]/g, '');
    const withoutTrailingPack = withoutCjk.replace(
      /(\s*[xX×]?\s*\*?\s*\d+(\.\d+)?\s*(KG|G|L|ML|PCS|PC|CTN|BOT|BIDON|SAC))\s*$/i,
      '',
    );
    return withoutTrailingPack.replace(/\s+/g, ' ').trim();
  }

  recoverUtf8(value: string | null | undefined): string {
    const safeValue = (value ?? '').trim();
    if (!safeValue) return '';

    if (this.containsCjk(safeValue)) return safeValue;

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

  resolveZhName(
    snapshotZh: string | null | undefined,
    productZh: string | null | undefined,
  ): string {
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

  sanitizeLabel(value: string | null | undefined): string {
    const safeValue = this.recoverUtf8(value);
    if (!safeValue) return '-';

    return this.replaceControlCharsWithSpaces(safeValue)
      .replace(/\s+/g, ' ')
      .trim();
  }

  sanitizePlainLabel(value: string | null | undefined): string {
    const safeValue = (value ?? '').trim();
    if (!safeValue) return '-';

    return this.replaceControlCharsWithSpaces(safeValue)
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildApiUrl(req: OrdersRequestContext, path: string): string {
    const normalizedPrefix = (process.env.API_PREFIX ?? '').replace(
      /^\/+|\/+$/g,
      '',
    );

    if (this.publicApiBaseUrl) {
      const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
      const normalizedPrefixEscaped = normalizedPrefix.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      const hasPrefixAlready =
        normalizedPrefix.length > 0 &&
        new RegExp(`/${normalizedPrefixEscaped}$`).test(normalizedBaseUrl);

      const baseUrlWithPrefix =
        normalizedPrefix.length > 0 && !hasPrefixAlready
          ? `${normalizedBaseUrl}/${normalizedPrefix}`
          : normalizedBaseUrl;

      return `${baseUrlWithPrefix}${path}`;
    }

    const normalizedPath = path.replace(/^\/+/, '');
    const prefixedPath = normalizedPrefix
      ? `/${normalizedPrefix}/${normalizedPath}`
      : `/${normalizedPath}`;

    const host = req.get('host');
    return `${req.protocol}://${host}${prefixedPath}`;
  }

  private drawHeader(doc: PdfDoc, input: OrderDocumentInput): void {
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

  private drawOrderMeta(doc: PdfDoc, input: OrderDocumentInput): void {
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

  private drawItemsTable(doc: PdfDoc, input: OrderDocumentInput): void {
    const left = doc.page.margins.left;
    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colProduct = Math.floor(contentWidth * 0.38);
    const colSpecification = Math.floor(contentWidth * 0.18);
    const colOrderUnit = Math.floor(contentWidth * 0.12);
    const colQty = Math.floor(contentWidth * 0.1);
    const colUnitPrice =
      contentWidth - colProduct - colSpecification - colOrderUnit - colQty;
    const rowHeight = 38;

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
        .text('Specification', left + colProduct + 4, y + 7, {
          width: colSpecification - 8,
          align: 'center',
        })
        .text('Unite', left + colProduct + colSpecification + 4, y + 7, {
          width: colOrderUnit - 8,
          align: 'center',
        })
        .text(
          'Qte',
          left + colProduct + colSpecification + colOrderUnit + 4,
          y + 7,
          {
            width: colQty - 8,
            align: 'center',
          },
        )
        .text(
          'PU HT',
          left + colProduct + colSpecification + colOrderUnit + colQty + 4,
          y + 7,
          {
            width: colUnitPrice - 8,
            align: 'right',
          },
        );
      doc.y = y + rowHeight;
    };

    const ensureSpace = (requiredHeight: number) => {
      const bottomLimit = doc.page.height - doc.page.margins.bottom - 90;
      if (doc.y + requiredHeight > bottomLimit) {
        doc.addPage();
        this.drawBackground(doc);
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
      const productSpecification = this.truncateText(
        this.sanitizeLabel(item.specification),
        26,
      );
      const orderUnit = this.sanitizeLabel(item.unit?.trim() || '-');

      if (index % 2 === 1) {
        doc
          .rect(left, y, contentWidth, rowHeight)
          .fillColor(this.pdfColors.rowAlt)
          .fill();
      }

      doc
        .fillColor(this.pdfColors.text)
        .font(this.resolveContentFont())
        .fontSize(10)
        .text(productNameFr, left + 8, y + 6, {
          width: colProduct - 12,
        });

      doc.font(this.resolveContentFont());
      doc
        .fontSize(9)
        .fillColor(this.pdfColors.muted)
        .text(productNameZh, left + 8, y + 20, {
          width: colProduct - 12,
        });

      doc.font(this.resolveContentFont());

      doc
        .fillColor(this.pdfColors.text)
        .fontSize(9)
        .text(productSpecification, left + colProduct + 4, y + 13, {
          width: colSpecification - 8,
          align: 'center',
        });

      doc.font(this.resolveContentFont());

      doc
        .fillColor(this.pdfColors.text)
        .fontSize(10)
        .text(orderUnit, left + colProduct + colSpecification + 4, y + 13, {
          width: colOrderUnit - 8,
          align: 'center',
        });

      doc
        .font('Helvetica')
        .fillColor(this.pdfColors.text)
        .fontSize(10)
        .text(
          String(item.quantity),
          left + colProduct + colSpecification + colOrderUnit + 4,
          y + 13,
          {
            width: colQty - 8,
            align: 'center',
          },
        )
        .text(
          item.unitPrice.toFixed(2),
          left + colProduct + colSpecification + colOrderUnit + colQty + 4,
          y + 13,
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

  private drawTotals(doc: PdfDoc, input: OrderDocumentInput): void {
    const cardWidth = 220;
    const x = doc.page.width - doc.page.margins.right - cardWidth;
    const y = doc.y;

    doc
      .roundedRect(x, y, cardWidth, 36, 8)
      .lineWidth(1)
      .strokeColor(this.pdfColors.primary)
      .stroke();

    doc
      .fillColor(this.pdfColors.primaryDark)
      .fontSize(11)
      .text(`Articles total: ${input.totalItems}`, x + 10, y + 12, {
        width: cardWidth - 20,
      });

    doc.y = y + 50;
  }

  private drawFooter(doc: PdfDoc): void {
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

  private truncateText(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 1)}...`;
  }

  private resolveContentFont(): string {
    return this.cjkFontPath ?? 'Helvetica';
  }

  private drawBackground(doc: PdfDoc): void {
    if (!existsSync(this.pdfBackgroundPath)) {
      return;
    }

    doc.save();
    doc.opacity(0.12);
    doc.image(this.pdfBackgroundPath, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });
    doc.restore();
  }

  private decodeUtf16Be(value: Buffer): string {
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

  private hasControlChars(value: string): boolean {
    return Array.from(value).some((character) =>
      this.isAsciiControlCharacter(character.codePointAt(0)),
    );
  }

  private containsCjk(value: string): boolean {
    return /[\u3400-\u9FFF]/.test(value);
  }

  private replaceControlCharsWithSpaces(value: string): string {
    return Array.from(value, (character) =>
      this.isAsciiControlCharacter(character.codePointAt(0)) ? ' ' : character,
    ).join('');
  }

  private isAsciiControlCharacter(codePoint: number | undefined): boolean {
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  }
}
