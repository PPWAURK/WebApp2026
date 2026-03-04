import { PrismaService } from '../prisma/prisma.service';
type Actor = {
    id: number;
    role: string;
    restaurantId: number | null;
};
type CreateOrderPayload = {
    deliveryDate: string;
    items: Array<{
        productId: number;
        quantity: number;
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
type HistoryAnalyticsPeriod = '7d' | '30d' | 'this_month' | 'last_month' | 'all';
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
export declare class OrdersService {
    private readonly prisma;
    private readonly storageRoot;
    private readonly publicApiBaseUrl;
    private readonly ordersDir;
    private readonly logoCandidatePaths;
    private readonly pdfBackgroundPath;
    private readonly cjkFontCandidatePaths;
    private readonly cjkFontPath;
    private readonly pdfColors;
    constructor(prisma: PrismaService);
    createOrder(actor: Actor, payload: CreateOrderPayload, req: {
        protocol: string;
        get: (name: string) => string | undefined;
    }): Promise<{
        id: number;
        number: string;
        supplierId: number;
        supplierName: string;
        deliveryDate: string;
        deliveryAddress: string;
        totalItems: number;
        totalAmount: number;
        bonUrl: string;
        commandeUrl: string;
        createdAt: Date;
    }>;
    listOrders(actor: Actor, req: {
        protocol: string;
        get: (name: string) => string | undefined;
    }): Promise<{
        id: number;
        number: string;
        supplierId: number;
        supplierName: string;
        deliveryDate: string;
        deliveryAddress: string;
        totalItems: number;
        totalAmount: number;
        bonUrl: string;
        commandeUrl: string;
        createdAt: Date;
    }[]>;
    resolveOrderFilePath(orderId: number, actor: Actor): Promise<string>;
    resolveBonFilePath(orderId: number, actor: Actor): Promise<string>;
    getTopOrderedProductsBySupplier(actor: Actor, supplierId?: number, month?: string): Promise<TopProductAggregate[]>;
    getTopOrderedProductMonths(actor: Actor, supplierId?: number): Promise<string[]>;
    getOrderHistoryAnalytics(actor: Actor, query: HistoryAnalyticsQuery): Promise<{
        period: HistoryAnalyticsPeriod;
        current: HistoryAnalyticsTotals;
        previous: HistoryAnalyticsTotals;
        delta: {
            items: number;
            amount: number;
            orders: number;
            uniqueProducts: number;
            itemsRate: number | null;
            amountRate: number | null;
        };
        topProducts: {
            productId: number;
            totalQuantity: number;
            nameFr: string;
            nameZh: string;
        }[];
        busiestDay: {
            date: string;
            totalItems: number;
            orders: number;
        };
        monthlyTrend: {
            month: string;
            orders: number;
            totalItems: number;
            totalAmount: number;
        }[];
    }>;
    deleteOrder(orderId: number, actor: Actor): Promise<{
        success: boolean;
        id: number;
    }>;
    private normalizeHistoryPeriod;
    private resolveHistoryPeriodRange;
    private buildOrderAnalyticsWhere;
    private computeHistoryTotals;
    private ensureCanManageOrders;
    private parseDeliveryDate;
    private parseMonthRange;
    private buildOrderNumber;
    private buildOrderUrl;
    private generateCommandePdf;
    private drawHeader;
    private drawOrderMeta;
    private drawItemsTable;
    private drawTotals;
    private drawFooter;
    private truncateText;
    private drawBackground;
    private makeFrLabel;
    private recoverUtf8;
    private resolveZhName;
    private sanitizeLabel;
    private decodeUtf16Be;
    private hasControlChars;
    private containsCjk;
}
export {};
