import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UploadMediaType,
  UploadCategory,
  UploadModule,
  UploadSection,
  type Prisma,
} from '@prisma/client';
import { basename, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersDocumentService } from './orders-document.service';
import type { OrdersRequestContext } from './orders.types';

type Actor = {
  id: number;
  role: string;
  employeeLevel: string | null;
  restaurantId: number | null;
};

type CreateOrderPayload = {
  deliveryDate: string;
  items: Array<{
    productId: number;
    quantity: number;
    specificationSlot?: number;
  }>;
};

type CreateOrderReturnPayload = {
  orderId: number;
  reason: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId: number;
    quantity: number;
    photoDocumentIds?: number[];
  }>;
};

type TopProductAggregate = {
  productId: number;
  supplierId: number;
  supplierName: string;
  month: string;
  nameFr: string;
  nameZh: string;
  totalQuantity: number;
  orderCount: number;
};

type HistoryAnalyticsPeriod =
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'all';

type HistoryAnalyticsQuery = {
  supplierId?: number;
  period?: string;
};

type HistoryAnalyticsTotals = {
  orders: number;
  totalItems: number;
  totalAmount: number;
  uniqueProducts: number;
  avgOrderAmount: number;
  avgOrderItems: number;
};

type ProductSpecificationSelection = {
  slot: number | null;
  specification: string | null;
  unit: string | null;
  unitPrice: number;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersDocumentService: OrdersDocumentService,
  ) {}

  async createOrder(
    actor: Actor,
    payload: CreateOrderPayload,
    req: OrdersRequestContext,
  ) {
    this.ensureCanManageOrders(actor);

    if (!actor.restaurantId) {
      throw new BadRequestException('User must be assigned to a restaurant');
    }

    const restaurantId = actor.restaurantId;
    const deliveryDate = this.parseDeliveryDate(payload.deliveryDate);

    if (!payload.items?.length) {
      throw new BadRequestException('At least one item is required');
    }

    const normalizedItems = payload.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      specificationSlot: item.specificationSlot ?? null,
    }));

    for (const item of normalizedItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException(
          'Item quantity must be a positive integer',
        );
      }

      if (
        item.specificationSlot !== null &&
        (!Number.isInteger(item.specificationSlot) ||
          item.specificationSlot < 1 ||
          item.specificationSlot > 3)
      ) {
        throw new BadRequestException(
          'Item specificationSlot must be an integer between 1 and 3',
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

      const selectedSpecification = this.resolveSelectedSpecification(
        product,
        item.specificationSlot,
      );
      const unitPrice = selectedSpecification.unitPrice;
      const lineTotal = unitPrice * item.quantity;

      return {
        product,
        quantity: item.quantity,
        specificationSlot: selectedSpecification.slot,
        specification: selectedSpecification.specification,
        unit: selectedSpecification.unit,
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

    const pdfItems = preparedItems.map((item) => {
      const frRaw = this.ordersDocumentService.sanitizePlainLabel(
        item.product.designationFr ?? item.product.nomCn,
      );
      const nameFr =
        this.ordersDocumentService.sanitizePlainLabel(
          this.ordersDocumentService.makeFrLabel(frRaw),
        ) || frRaw;

      const zhRaw = this.ordersDocumentService.recoverUtf8(item.product.nomCn);
      const nameZh = this.ordersDocumentService.sanitizeLabel(zhRaw);
      const specification = this.ordersDocumentService.sanitizeLabel(
        this.ordersDocumentService.recoverUtf8(item.specification),
      );

      const unit = this.ordersDocumentService.sanitizeLabel(
        item.unit?.trim() || '-',
      );

      return {
        nameFr,
        nameZh,
        specification,
        unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      };
    });

    let generatedOrderFilePath: string | null = null;

    try {
      const createdOrder = await this.prisma.$transaction(async (tx) => {
        const draftOrder = await tx.purchaseOrder.create({
          data: {
            number: `PO-TMP-${Date.now()}`,
            supplierId,
            restaurantId,
            createdByUserId: actor.id,
            deliveryDate,
            deliveryAddress: restaurant.address,
            totalItems,
            totalAmount,
            bonFileName: 'pending.pdf',
          },
        });

        const orderNumber = this.buildOrderNumber(
          draftOrder.id,
          draftOrder.createdAt,
        );
        const orderFileName = `commande-${orderNumber}.pdf`;

        await tx.purchaseOrder.update({
          where: { id: draftOrder.id },
          data: {
            number: orderNumber,
            bonFileName: orderFileName,
          },
        });

        await tx.purchaseOrderItem.createMany({
          data: preparedItems.map((item) => ({
            purchaseOrderId: draftOrder.id,
            productId: item.product.id,
            supplierId,
            specificationSlot: item.specificationSlot,
            quantity: item.quantity,
            unitPriceHt: item.unitPrice,
            lineTotal: item.lineTotal,
            nameZh: item.product.nomCn,
            nameFr: item.product.designationFr,
            specification: item.specification,
            unit: item.unit,
            category: item.product.categorie,
          })),
        });

        generatedOrderFilePath =
          this.ordersDocumentService.buildOrderFilePath(orderFileName);

        await this.ordersDocumentService.generateCommandePdf({
          filePath: generatedOrderFilePath,
          orderNumber,
          supplierName: supplier.nom,
          restaurantName: restaurant.name,
          deliveryDate: payload.deliveryDate,
          deliveryAddress: restaurant.address,
          items: pdfItems,
          totalItems,
          totalAmount,
        });

        return {
          id: draftOrder.id,
          createdAt: draftOrder.createdAt,
          number: orderNumber,
        };
      });

      const commandeUrl = this.ordersDocumentService.buildOrderUrl(
        req,
        createdOrder.id,
      );

      return {
        id: createdOrder.id,
        number: createdOrder.number,
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
    } catch (error) {
      this.ordersDocumentService.deleteFileIfExists(generatedOrderFilePath);
      throw error;
    }
  }

  async listOrders(actor: Actor, req: OrdersRequestContext) {
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
      const commandeUrl = this.ordersDocumentService.buildOrderUrl(
        req,
        order.id,
      );

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

  async listOrderReturns(actor: Actor, req: OrdersRequestContext) {
    this.ensureCanManageOrders(actor);

    const returns = await this.prisma.purchaseReturn.findMany({
      where:
        actor.role === 'ADMIN'
          ? actor.restaurantId
            ? { restaurantId: actor.restaurantId }
            : undefined
          : { restaurantId: actor.restaurantId ?? -1 },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            number: true,
            deliveryDate: true,
          },
        },
        supplier: {
          select: {
            id: true,
            nom: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          orderBy: {
            id: 'asc',
          },
          select: {
            specificationSlot: true,
            quantity: true,
            nameZh: true,
            nameFr: true,
            specification: true,
            unit: true,
            photos: {
              orderBy: {
                id: 'asc',
              },
              select: {
                document: {
                  select: {
                    id: true,
                    fileName: true,
                    originalName: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 120,
    });

    return returns.map((entry) => ({
      id: entry.id,
      orderId: entry.purchaseOrderId,
      orderNumber: entry.purchaseOrder.number,
      supplierId: entry.supplierId,
      supplierName: entry.supplier.nom,
      restaurantId: entry.restaurantId,
      restaurantName: entry.restaurant.name,
      deliveryDate: entry.purchaseOrder.deliveryDate.toISOString().slice(0, 10),
      reason: entry.reason,
      notes: entry.notes ?? '',
      totalItems: entry.totalItems,
      createdAt: entry.createdAt,
      items: entry.items.map((item) => ({
        specificationSlot: item.specificationSlot,
        quantity: item.quantity,
        nameZh: this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(item.nameZh),
        ),
        nameFr: this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(item.nameFr),
        ),
        specification: this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(item.specification),
        ),
        unit: this.ordersDocumentService.sanitizeLabel(item.unit?.trim()),
        photos: item.photos.map((photo) => ({
          documentId: photo.document.id,
          originalName: this.ordersDocumentService.sanitizeLabel(
            photo.document.originalName,
          ),
          fileUrl: this.ordersDocumentService.buildUploadFileUrl(
            req,
            photo.document.category,
            photo.document.fileName,
          ),
        })),
      })),
    }));
  }

  async getOrderReturnDraft(orderId: number, actor: Actor) {
    this.ensureCanManageOrders(actor);

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        supplier: {
          select: {
            id: true,
            nom: true,
          },
        },
        items: {
          orderBy: {
            id: 'asc',
          },
          select: {
            id: true,
            productId: true,
            specificationSlot: true,
            quantity: true,
            nameZh: true,
            nameFr: true,
            specification: true,
            unit: true,
            category: true,
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

    const returnedItems = await this.prisma.purchaseReturnItem.findMany({
      where: {
        purchaseReturn: {
          purchaseOrderId: orderId,
        },
      },
      select: {
        purchaseOrderItemId: true,
        quantity: true,
      },
    });

    const returnedQuantityByItemId = this.sumReturnedQuantities(returnedItems);

    return {
      orderId: order.id,
      orderNumber: order.number,
      supplierId: order.supplierId,
      supplierName: order.supplier.nom,
      deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
      items: order.items.map((item) => {
        const returnedQuantity = returnedQuantityByItemId.get(item.id) ?? 0;
        const remainingQuantity = Math.max(item.quantity - returnedQuantity, 0);

        return {
          purchaseOrderItemId: item.id,
          productId: Number(item.productId),
          specificationSlot: item.specificationSlot,
          category: item.category,
          nameZh: this.ordersDocumentService.sanitizeLabel(
            this.ordersDocumentService.recoverUtf8(item.nameZh),
          ),
          nameFr: this.ordersDocumentService.sanitizeLabel(
            this.ordersDocumentService.recoverUtf8(item.nameFr),
          ),
          specification: this.ordersDocumentService.sanitizeLabel(
            this.ordersDocumentService.recoverUtf8(item.specification),
          ),
          unit: this.ordersDocumentService.sanitizeLabel(item.unit?.trim()),
          orderedQuantity: item.quantity,
          returnedQuantity,
          remainingQuantity,
        };
      }),
    };
  }

  async createOrderReturn(actor: Actor, payload: CreateOrderReturnPayload) {
    this.ensureCanManageOrders(actor);

    const reason = payload.reason.trim();
    if (!reason) {
      throw new BadRequestException('reason is required');
    }

    if (!payload.items?.length) {
      throw new BadRequestException('At least one return item is required');
    }

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: payload.orderId },
      include: {
        supplier: {
          select: {
            id: true,
            nom: true,
          },
        },
        items: {
          orderBy: {
            id: 'asc',
          },
          select: {
            id: true,
            productId: true,
            specificationSlot: true,
            quantity: true,
            nameZh: true,
            nameFr: true,
            specification: true,
            unit: true,
            category: true,
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

    const normalizedItems = payload.items.map((item) => ({
      purchaseOrderItemId: item.purchaseOrderItemId,
      quantity: item.quantity,
      photoDocumentIds: Array.isArray(item.photoDocumentIds)
        ? item.photoDocumentIds
        : [],
    }));

    if (
      normalizedItems.some(
        (item) =>
          !Number.isInteger(item.purchaseOrderItemId) ||
          item.purchaseOrderItemId <= 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.photoDocumentIds.some(
            (documentId) => !Number.isInteger(documentId) || documentId <= 0,
          ),
      )
    ) {
      throw new BadRequestException(
        'Return items and photo document ids must contain positive integers only',
      );
    }

    const distinctOrderItemIds = new Set(
      normalizedItems.map((item) => item.purchaseOrderItemId),
    );
    if (distinctOrderItemIds.size !== normalizedItems.length) {
      throw new BadRequestException('Return items must be unique');
    }

    const distinctPhotoDocumentIds = new Set<number>();
    for (const item of normalizedItems) {
      if (
        new Set(item.photoDocumentIds).size !== item.photoDocumentIds.length
      ) {
        throw new BadRequestException(
          'Photo document ids must be unique per return item',
        );
      }

      for (const documentId of item.photoDocumentIds) {
        if (distinctPhotoDocumentIds.has(documentId)) {
          throw new BadRequestException(
            'Photo document ids cannot be reused across return items',
          );
        }
        distinctPhotoDocumentIds.add(documentId);
      }
    }

    const orderItemById = new Map(order.items.map((item) => [item.id, item]));
    const unknownOrderItemId = normalizedItems.find(
      (item) => !orderItemById.has(item.purchaseOrderItemId),
    )?.purchaseOrderItemId;
    if (unknownOrderItemId) {
      throw new BadRequestException(
        'Return item does not belong to this order',
      );
    }

    const returnedItems = await this.prisma.purchaseReturnItem.findMany({
      where: {
        purchaseReturn: {
          purchaseOrderId: order.id,
        },
        purchaseOrderItemId: {
          in: Array.from(distinctOrderItemIds),
        },
      },
      select: {
        purchaseOrderItemId: true,
        quantity: true,
      },
    });

    const returnedQuantityByItemId = this.sumReturnedQuantities(returnedItems);
    const returnPhotoDocuments =
      distinctPhotoDocumentIds.size > 0
        ? await this.prisma.document.findMany({
            where: {
              id: {
                in: Array.from(distinctPhotoDocumentIds),
              },
            },
            select: {
              id: true,
              mediaType: true,
              module: true,
              section: true,
            },
          })
        : [];

    this.ensureValidReturnPhotoDocuments(
      Array.from(distinctPhotoDocumentIds),
      returnPhotoDocuments,
    );

    const preparedItems = normalizedItems.map((item) => {
      const orderItem = orderItemById.get(item.purchaseOrderItemId);
      if (!orderItem) {
        throw new BadRequestException(
          'Return item does not belong to this order',
        );
      }

      const alreadyReturned = returnedQuantityByItemId.get(orderItem.id) ?? 0;
      const remainingQuantity = orderItem.quantity - alreadyReturned;

      if (remainingQuantity <= 0) {
        throw new BadRequestException(
          'Selected item has already been fully returned',
        );
      }

      if (item.quantity > remainingQuantity) {
        throw new BadRequestException(
          'Return quantity exceeds remaining quantity',
        );
      }

      return {
        orderItem,
        quantity: item.quantity,
        photoDocumentIds: item.photoDocumentIds,
      };
    });

    const totalItems = preparedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const trimmedNotes = payload.notes?.trim() ? payload.notes.trim() : null;

    const createdReturn = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseReturn.create({
        data: {
          purchaseOrderId: order.id,
          supplierId: order.supplierId,
          restaurantId: order.restaurantId,
          createdByUserId: actor.id,
          reason,
          notes: trimmedNotes,
          totalItems,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

      for (const item of preparedItems) {
        const createdItem = await tx.purchaseReturnItem.create({
          data: {
            purchaseReturnId: created.id,
            purchaseOrderItemId: item.orderItem.id,
            productId: item.orderItem.productId,
            specificationSlot: item.orderItem.specificationSlot,
            quantity: item.quantity,
            nameZh: item.orderItem.nameZh,
            nameFr: item.orderItem.nameFr,
            specification: item.orderItem.specification,
            unit: item.orderItem.unit,
            category: item.orderItem.category,
          },
          select: {
            id: true,
          },
        });

        if (item.photoDocumentIds.length === 0) {
          continue;
        }

        await tx.purchaseReturnItemPhoto.createMany({
          data: item.photoDocumentIds.map((documentId) => ({
            purchaseReturnItemId: createdItem.id,
            documentId,
          })),
        });
      }

      return created;
    });

    return {
      id: createdReturn.id,
      orderId: order.id,
      orderNumber: order.number,
      supplierId: order.supplierId,
      supplierName: order.supplier.nom,
      reason,
      notes: trimmedNotes ?? '',
      totalItems,
      createdAt: createdReturn.createdAt,
    };
  }

  async deleteOrderReturn(returnId: number, actor: Actor) {
    this.ensureCanManageOrders(actor);

    const existingReturn = await this.prisma.purchaseReturn.findUnique({
      where: { id: returnId },
      select: {
        id: true,
        restaurantId: true,
        items: {
          select: {
            photos: {
              select: {
                document: {
                  select: {
                    id: true,
                    fileName: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingReturn) {
      return {
        success: true,
        id: returnId,
      };
    }

    if (
      actor.role !== 'ADMIN' &&
      existingReturn.restaurantId !== actor.restaurantId
    ) {
      throw new ForbiddenException(
        'Order return does not belong to your restaurant',
      );
    }

    const attachedDocuments = existingReturn.items.flatMap((item) =>
      item.photos.map((photo) => photo.document),
    );
    const uniqueDocuments = Array.from(
      new Map(
        attachedDocuments.map((document) => [document.id, document]),
      ).values(),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseReturn.delete({
        where: { id: returnId },
      });

      if (uniqueDocuments.length > 0) {
        await tx.document.deleteMany({
          where: {
            id: {
              in: uniqueDocuments.map((document) => document.id),
            },
          },
        });
      }
    });

    for (const document of uniqueDocuments) {
      this.ordersDocumentService.deleteFileIfExists(
        this.buildUploadFilePath(document.category, document.fileName),
      );
    }

    return {
      success: true,
      id: returnId,
    };
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
            specificationSlot: true,
            specification: true,
            unit: true,
            quantity: true,
            unitPriceHt: true,
            product: {
              select: {
                nomCn: true,
                designationFr: true,
                specification: true,
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

    const fullPath = this.ordersDocumentService.buildOrderFilePath(
      order.bonFileName,
    );

    await this.ordersDocumentService.generateCommandePdf({
      filePath: fullPath,
      orderNumber: order.number,
      supplierName: order.supplier.nom,
      restaurantName: order.restaurant.name,
      deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((item) => {
        const frRaw = this.ordersDocumentService.sanitizePlainLabel(
          item.product.designationFr ?? item.nameZh,
        );
        const nameFr =
          this.ordersDocumentService.sanitizePlainLabel(
            this.ordersDocumentService.makeFrLabel(frRaw),
          ) || frRaw;

        const nameZh = this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.resolveZhName(
            item.nameZh,
            item.product.nomCn,
          ),
        );
        const specification = this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(
            item.specification ?? item.product.specification,
          ),
        );

        const unitCandidate =
          (item.unit ?? '').trim() || (item.product.unite ?? '').trim() || '-';
        const unit = this.ordersDocumentService.sanitizeLabel(unitCandidate);

        return {
          nameFr,
          nameZh,
          specification,
          unit,
          quantity: item.quantity,
          unitPrice: Number(item.unitPriceHt),
          lineTotal: Number(item.quantity) * Number(item.unitPriceHt),
        };
      }),
      totalItems: order.totalItems,
      totalAmount: Number(order.totalAmount),
    });

    if (!this.ordersDocumentService.hasOrderFile(fullPath)) {
      throw new NotFoundException('Order file not found');
    }

    return fullPath;
  }

  async resolveBonFilePath(orderId: number, actor: Actor) {
    return this.resolveOrderFilePath(orderId, actor);
  }

  async getTopOrderedProductsBySupplier(
    actor: Actor,
    supplierId?: number,
    month?: string,
  ): Promise<TopProductAggregate[]> {
    this.ensureCanManageOrders(actor);

    if (supplierId !== undefined) {
      const supplier = await this.prisma.fournisseur.findUnique({
        where: { id: supplierId },
        select: { id: true },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    const purchaseOrderWhere: {
      restaurantId?: number;
      supplierId?: number;
      deliveryDate?: {
        gte: Date;
        lt: Date;
      };
    } = {};

    if (actor.role !== 'ADMIN') {
      purchaseOrderWhere.restaurantId = actor.restaurantId ?? -1;
    } else if (actor.restaurantId) {
      purchaseOrderWhere.restaurantId = actor.restaurantId;
    }

    if (supplierId !== undefined) {
      purchaseOrderWhere.supplierId = supplierId;
    }

    if (month) {
      const { start, end } = this.parseMonthRange(month);
      purchaseOrderWhere.deliveryDate = {
        gte: start,
        lt: end,
      };
    }

    const whereClause =
      Object.keys(purchaseOrderWhere).length > 0
        ? {
            purchaseOrder: purchaseOrderWhere,
          }
        : undefined;

    const items = await this.prisma.purchaseOrderItem.findMany({
      where: whereClause,
      include: {
        purchaseOrder: {
          select: {
            supplierId: true,
            deliveryDate: true,
            supplier: {
              select: {
                nom: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            designationFr: true,
            nomCn: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: 2400,
    });

    if (month) {
      const productMap = new Map<string, TopProductAggregate>();

      for (const item of items) {
        const itemSupplierId = item.purchaseOrder.supplierId;
        const productId = Number(item.product.id);
        const productKey = `${itemSupplierId}:${productId}`;

        const productEntry = productMap.get(productKey) ?? {
          productId,
          supplierId: itemSupplierId,
          supplierName: item.purchaseOrder.supplier.nom,
          month,
          nameFr: this.ordersDocumentService.sanitizeLabel(
            this.ordersDocumentService.recoverUtf8(item.product.designationFr),
          ),
          nameZh: this.ordersDocumentService.sanitizeLabel(
            this.ordersDocumentService.recoverUtf8(item.product.nomCn),
          ),
          totalQuantity: 0,
          orderCount: 0,
        };

        productEntry.totalQuantity += item.quantity;
        productEntry.orderCount += 1;

        productMap.set(productKey, productEntry);
      }

      return Array.from(productMap.values())
        .sort((left, right) => right.totalQuantity - left.totalQuantity)
        .slice(0, 5);
    }

    const productTotals = new Map<number, number>();

    for (const item of items) {
      const productId = Number(item.product.id);
      const total = productTotals.get(productId) ?? 0;
      productTotals.set(productId, total + item.quantity);
    }

    const topProductIds = new Set(
      Array.from(productTotals.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([productId]) => productId),
    );

    const productMonthMap = new Map<string, TopProductAggregate>();

    for (const item of items) {
      const supplierId = item.purchaseOrder.supplierId;
      const productId = Number(item.product.id);
      if (!topProductIds.has(productId)) {
        continue;
      }

      const month = item.purchaseOrder.deliveryDate.toISOString().slice(0, 7);
      const productKey = `${month}:${supplierId}:${productId}`;

      const productEntry = productMonthMap.get(productKey) ?? {
        productId,
        supplierId,
        supplierName: item.purchaseOrder.supplier.nom,
        month,
        nameFr: this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(item.product.designationFr),
        ),
        nameZh: this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(item.product.nomCn),
        ),
        totalQuantity: 0,
        orderCount: 0,
      };

      productEntry.totalQuantity += item.quantity;
      productEntry.orderCount += 1;

      productMonthMap.set(productKey, productEntry);
    }

    return Array.from(productMonthMap.values()).sort((left, right) => {
      if (left.month !== right.month) {
        return left.month.localeCompare(right.month);
      }

      return right.totalQuantity - left.totalQuantity;
    });
  }

  async getTopOrderedProductMonths(
    actor: Actor,
    supplierId?: number,
  ): Promise<string[]> {
    this.ensureCanManageOrders(actor);

    if (supplierId !== undefined) {
      const supplier = await this.prisma.fournisseur.findUnique({
        where: { id: supplierId },
        select: { id: true },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    const whereClause =
      actor.role === 'ADMIN'
        ? actor.restaurantId
          ? {
              restaurantId: actor.restaurantId,
              ...(supplierId !== undefined ? { supplierId } : {}),
            }
          : supplierId !== undefined
            ? { supplierId }
            : undefined
        : {
            restaurantId: actor.restaurantId ?? -1,
            ...(supplierId !== undefined ? { supplierId } : {}),
          };

    const orders = await this.prisma.purchaseOrder.findMany({
      where: whereClause,
      select: {
        deliveryDate: true,
      },
      orderBy: {
        deliveryDate: 'desc',
      },
      take: 2400,
    });

    return Array.from(
      new Set(
        orders.map((order) => order.deliveryDate.toISOString().slice(0, 7)),
      ),
    ).sort((left, right) => right.localeCompare(left));
  }

  async getOrderHistoryAnalytics(actor: Actor, query: HistoryAnalyticsQuery) {
    this.ensureCanManageOrders(actor);

    const supplierId = query.supplierId;
    if (supplierId !== undefined) {
      const supplier = await this.prisma.fournisseur.findUnique({
        where: { id: supplierId },
        select: { id: true },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    const period = this.normalizeHistoryPeriod(query.period);
    const { start, end, previousStart, previousEnd } =
      this.resolveHistoryPeriodRange(period);

    const currentWhere = this.buildOrderAnalyticsWhere(
      actor,
      supplierId,
      start,
      end,
    );
    const previousWhere = this.buildOrderAnalyticsWhere(
      actor,
      supplierId,
      previousStart,
      previousEnd,
    );

    const [
      currentOrders,
      previousOrders,
      currentItems,
      previousItems,
      trendOrders,
    ] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: currentWhere,
        select: {
          id: true,
          deliveryDate: true,
          totalItems: true,
          totalAmount: true,
        },
        orderBy: {
          deliveryDate: 'desc',
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: previousWhere,
        select: {
          id: true,
          deliveryDate: true,
          totalItems: true,
          totalAmount: true,
        },
      }),
      this.prisma.purchaseOrderItem.findMany({
        where: {
          purchaseOrder: currentWhere,
        },
        select: {
          productId: true,
          quantity: true,
          product: {
            select: {
              designationFr: true,
              nomCn: true,
            },
          },
        },
      }),
      this.prisma.purchaseOrderItem.findMany({
        where: {
          purchaseOrder: previousWhere,
        },
        select: {
          productId: true,
          quantity: true,
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: this.buildOrderAnalyticsWhere(
          actor,
          supplierId,
          new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth() - 5,
              1,
            ),
          ),
          undefined,
        ),
        select: {
          deliveryDate: true,
          totalItems: true,
          totalAmount: true,
        },
        orderBy: {
          deliveryDate: 'asc',
        },
      }),
    ]);

    const currentTotals = this.computeHistoryTotals(
      currentOrders,
      currentItems,
    );
    const previousTotals = this.computeHistoryTotals(
      previousOrders,
      previousItems,
    );

    const deltaItems = currentTotals.totalItems - previousTotals.totalItems;
    const deltaAmount = currentTotals.totalAmount - previousTotals.totalAmount;
    const deltaOrders = currentTotals.orders - previousTotals.orders;
    const deltaUniqueProducts =
      currentTotals.uniqueProducts - previousTotals.uniqueProducts;

    const topProductsMap = new Map<
      number,
      {
        productId: number;
        totalQuantity: number;
        nameFr: string;
        nameZh: string;
      }
    >();

    for (const item of currentItems) {
      const productId = Number(item.productId);
      const entry = topProductsMap.get(productId) ?? {
        productId,
        totalQuantity: 0,
        nameFr: this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(item.product.designationFr),
        ),
        nameZh: this.ordersDocumentService.sanitizeLabel(
          this.ordersDocumentService.recoverUtf8(item.product.nomCn),
        ),
      };

      entry.totalQuantity += item.quantity;
      topProductsMap.set(productId, entry);
    }

    const topProducts = Array.from(topProductsMap.values())
      .sort((left, right) => right.totalQuantity - left.totalQuantity)
      .slice(0, 5);

    const dayMap = new Map<
      string,
      { date: string; totalItems: number; orders: number }
    >();
    for (const order of currentOrders) {
      const date = order.deliveryDate.toISOString().slice(0, 10);
      const entry = dayMap.get(date) ?? { date, totalItems: 0, orders: 0 };
      entry.totalItems += order.totalItems;
      entry.orders += 1;
      dayMap.set(date, entry);
    }

    const busiestDay =
      Array.from(dayMap.values()).sort((left, right) => {
        if (left.totalItems !== right.totalItems) {
          return right.totalItems - left.totalItems;
        }

        return right.orders - left.orders;
      })[0] ?? null;

    const trendMap = new Map<
      string,
      { month: string; orders: number; totalItems: number; totalAmount: number }
    >();
    for (const order of trendOrders) {
      const month = order.deliveryDate.toISOString().slice(0, 7);
      const entry = trendMap.get(month) ?? {
        month,
        orders: 0,
        totalItems: 0,
        totalAmount: 0,
      };
      entry.orders += 1;
      entry.totalItems += order.totalItems;
      entry.totalAmount += Number(order.totalAmount);
      trendMap.set(month, entry);
    }

    const monthlyTrend = Array.from(trendMap.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .slice(-6);

    return {
      period,
      current: currentTotals,
      previous: previousTotals,
      delta: {
        items: deltaItems,
        amount: Number(deltaAmount.toFixed(2)),
        orders: deltaOrders,
        uniqueProducts: deltaUniqueProducts,
        itemsRate:
          previousTotals.totalItems > 0
            ? Number(
                ((deltaItems / previousTotals.totalItems) * 100).toFixed(1),
              )
            : null,
        amountRate:
          previousTotals.totalAmount > 0
            ? Number(
                ((deltaAmount / previousTotals.totalAmount) * 100).toFixed(1),
              )
            : null,
      },
      topProducts,
      busiestDay,
      monthlyTrend,
    };
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

    const relatedReturns = await this.prisma.purchaseReturn.findMany({
      where: {
        purchaseOrderId: orderId,
      },
      select: {
        id: true,
      },
      take: 1,
    });

    if (relatedReturns.length > 0) {
      throw new BadRequestException('Order with returns cannot be deleted');
    }

    await this.prisma.purchaseOrder.delete({
      where: { id: orderId },
    });

    this.ordersDocumentService.deleteFileIfExists(
      this.ordersDocumentService.buildOrderFilePath(order.bonFileName),
    );

    return {
      success: true,
      id: orderId,
    };
  }

  private normalizeHistoryPeriod(raw?: string): HistoryAnalyticsPeriod {
    if (!raw) {
      return 'this_month';
    }

    if (
      raw === '7d' ||
      raw === '30d' ||
      raw === 'this_month' ||
      raw === 'last_month' ||
      raw === 'all'
    ) {
      return raw;
    }

    throw new BadRequestException(
      'period must be one of 7d, 30d, this_month, last_month, all',
    );
  }

  private resolveHistoryPeriodRange(period: HistoryAnalyticsPeriod) {
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    if (period === '7d') {
      const start = new Date(todayUtc);
      start.setUTCDate(start.getUTCDate() - 6);

      const previousEnd = new Date(start);
      const previousStart = new Date(start);
      previousStart.setUTCDate(previousStart.getUTCDate() - 7);

      return {
        start,
        end: undefined,
        previousStart,
        previousEnd,
      };
    }

    if (period === '30d') {
      const start = new Date(todayUtc);
      start.setUTCDate(start.getUTCDate() - 29);

      const previousEnd = new Date(start);
      const previousStart = new Date(start);
      previousStart.setUTCDate(previousStart.getUTCDate() - 30);

      return {
        start,
        end: undefined,
        previousStart,
        previousEnd,
      };
    }

    if (period === 'this_month') {
      const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      const previousStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
      );

      return {
        start,
        end: undefined,
        previousStart,
        previousEnd: start,
      };
    }

    if (period === 'last_month') {
      const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
      );
      const end = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      const previousStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1),
      );

      return {
        start,
        end,
        previousStart,
        previousEnd: start,
      };
    }

    return {
      start: undefined,
      end: undefined,
      previousStart: undefined,
      previousEnd: undefined,
    };
  }

  private buildOrderAnalyticsWhere(
    actor: Actor,
    supplierId?: number,
    start?: Date,
    end?: Date,
  ): Prisma.PurchaseOrderWhereInput {
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (actor.role !== 'ADMIN') {
      where.restaurantId = actor.restaurantId ?? -1;
    } else if (actor.restaurantId) {
      where.restaurantId = actor.restaurantId;
    }

    if (supplierId !== undefined) {
      where.supplierId = supplierId;
    }

    if (start || end) {
      where.deliveryDate = {
        ...(start ? { gte: start } : {}),
        ...(end ? { lt: end } : {}),
      };
    }

    return where;
  }

  private computeHistoryTotals(
    orders: Array<{ totalItems: number; totalAmount: Prisma.Decimal | number }>,
    items: Array<{ productId: bigint | number }>,
  ): HistoryAnalyticsTotals {
    const ordersCount = orders.length;
    const totalItems = orders.reduce(
      (sum, order) => sum + Number(order.totalItems),
      0,
    );
    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );
    const uniqueProducts = new Set(items.map((item) => Number(item.productId)))
      .size;

    return {
      orders: ordersCount,
      totalItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      uniqueProducts,
      avgOrderAmount:
        ordersCount > 0 ? Number((totalAmount / ordersCount).toFixed(2)) : 0,
      avgOrderItems:
        ordersCount > 0 ? Number((totalItems / ordersCount).toFixed(1)) : 0,
    };
  }

  private resolveSelectedSpecification(
    product: {
      specification: string | null;
      unite: string | null;
      prixUHt: Prisma.Decimal | number | null;
      specification2?: string | null;
      unite2?: string | null;
      prixUHt2?: Prisma.Decimal | number | null;
      specification3?: string | null;
      unite3?: string | null;
      prixUHt3?: Prisma.Decimal | number | null;
    },
    specificationSlot: number | null,
  ): ProductSpecificationSelection {
    const selectableSpecifications = this.listSelectableSpecifications(product);
    const hasAdditionalSpecificationChoices = selectableSpecifications.some(
      (entry) => entry.slot !== 1,
    );

    if (!hasAdditionalSpecificationChoices) {
      if (specificationSlot !== null && specificationSlot !== 1) {
        throw new BadRequestException(
          'Selected product specification does not exist',
        );
      }

      return {
        slot: this.normalizeSpecificationText(product.specification) ? 1 : null,
        specification: this.normalizeSpecificationText(product.specification),
        unit: this.normalizeSpecificationText(product.unite),
        unitPrice: Number(product.prixUHt ?? 0),
      };
    }

    if (specificationSlot === null) {
      throw new BadRequestException(
        'Item specificationSlot is required for products with multiple specifications',
      );
    }

    const selected = selectableSpecifications.find(
      (entry) => entry.slot === specificationSlot,
    );
    if (!selected) {
      throw new BadRequestException(
        'Selected product specification does not exist',
      );
    }

    return selected;
  }

  private listSelectableSpecifications(product: {
    specification: string | null;
    unite: string | null;
    prixUHt: Prisma.Decimal | number | null;
    specification2?: string | null;
    unite2?: string | null;
    prixUHt2?: Prisma.Decimal | number | null;
    specification3?: string | null;
    unite3?: string | null;
    prixUHt3?: Prisma.Decimal | number | null;
  }): ProductSpecificationSelection[] {
    return [
      {
        slot: 1,
        specification: this.normalizeSpecificationText(product.specification),
        unit: this.normalizeSpecificationText(product.unite),
        unitPrice: Number(product.prixUHt ?? 0),
      },
      {
        slot: 2,
        specification: this.normalizeSpecificationText(product.specification2),
        unit: this.normalizeSpecificationText(product.unite2),
        unitPrice: Number(product.prixUHt2 ?? 0),
      },
      {
        slot: 3,
        specification: this.normalizeSpecificationText(product.specification3),
        unit: this.normalizeSpecificationText(product.unite3),
        unitPrice: Number(product.prixUHt3 ?? 0),
      },
    ].filter((entry) => entry.specification !== null);
  }

  private normalizeSpecificationText(value: string | null | undefined) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private sumReturnedQuantities(
    items: Array<{ purchaseOrderItemId: number; quantity: number }>,
  ) {
    const returnedQuantityByItemId = new Map<number, number>();

    for (const item of items) {
      const current =
        returnedQuantityByItemId.get(item.purchaseOrderItemId) ?? 0;
      returnedQuantityByItemId.set(
        item.purchaseOrderItemId,
        current + item.quantity,
      );
    }

    return returnedQuantityByItemId;
  }

  private ensureValidReturnPhotoDocuments(
    expectedDocumentIds: number[],
    documents: Array<{
      id: number;
      mediaType: UploadMediaType;
      module: UploadModule;
      section: UploadSection;
    }>,
  ) {
    if (expectedDocumentIds.length === 0) {
      return;
    }

    const foundIds = new Set(documents.map((document) => document.id));
    const missingDocumentId = expectedDocumentIds.find(
      (documentId) => !foundIds.has(documentId),
    );
    if (missingDocumentId) {
      throw new BadRequestException('Return photo document not found');
    }

    const invalidDocument = documents.find(
      (document) =>
        document.mediaType !== UploadMediaType.image ||
        document.module !== UploadModule.MANAGEMENT ||
        document.section !== UploadSection.ORDER_RETURNS,
    );
    if (invalidDocument) {
      throw new BadRequestException(
        'Return photos must be uploaded as management return images',
      );
    }
  }

  private ensureCanManageOrders(actor: Actor) {
    if (actor.role === 'ADMIN' || actor.role === 'MANAGER') {
      return;
    }

    const ORDER_ACCESS_LEVELS = [
      'L5_PAM',
      'L5_AM',
      'L6_PM',
      'L6_MA',
      'L7_PDI',
      'L7_D',
    ];

    if (
      actor.role === 'EMPLOYEE' &&
      actor.employeeLevel !== null &&
      ORDER_ACCESS_LEVELS.includes(actor.employeeLevel)
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient level to access orders');
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

  private parseMonthRange(raw: string) {
    if (!/^\d{4}-\d{2}$/.test(raw)) {
      throw new BadRequestException('month must match YYYY-MM');
    }

    const [yearRaw, monthRaw] = raw.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException('month must be valid');
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    return { start, end };
  }

  private buildOrderNumber(orderId: number, createdAt: Date) {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const day = String(createdAt.getDate()).padStart(2, '0');
    const paddedId = String(orderId).padStart(4, '0');
    return `PO-${year}${month}${day}-${paddedId}`;
  }

  private buildUploadFilePath(category: UploadCategory, fileName: string) {
    const storageRoot =
      process.env.STORAGE_ROOT_PATH ?? join(process.cwd(), 'uploads');
    const categoryDir =
      category === UploadCategory.images
        ? 'images'
        : category === UploadCategory.videos
          ? 'videos'
          : 'documents';

    return join(storageRoot, categoryDir, basename(fileName));
  }
}
