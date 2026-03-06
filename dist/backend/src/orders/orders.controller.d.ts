import type { Request, Response } from 'express';
import { OrdersService } from './orders.service';
type AuthenticatedRequest = Request & {
    user?: {
        id: number;
        role: string;
        restaurantId: number | null;
    };
};
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(req: AuthenticatedRequest, body: {
        deliveryDate: string;
        items: Array<{
            productId: number;
            quantity: number;
        }>;
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
    listOrders(req: AuthenticatedRequest): Promise<{
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
    topOrderedProducts(req: AuthenticatedRequest, supplierIdRaw?: string, monthRaw?: string): Promise<{
        productId: number;
        supplierId: number;
        supplierName: string;
        month: string;
        nameFr: string;
        nameZh: string;
        totalQuantity: number;
        orderCount: number;
    }[]>;
    topOrderedProductMonths(req: AuthenticatedRequest, supplierIdRaw?: string): Promise<string[]>;
    historyAnalytics(req: AuthenticatedRequest, supplierIdRaw?: string, periodRaw?: string): Promise<{
        period: "7d" | "30d" | "this_month" | "last_month" | "all";
        current: {
            orders: number;
            totalItems: number;
            totalAmount: number;
            uniqueProducts: number;
            avgOrderAmount: number;
            avgOrderItems: number;
        };
        previous: {
            orders: number;
            totalItems: number;
            totalAmount: number;
            uniqueProducts: number;
            avgOrderAmount: number;
            avgOrderItems: number;
        };
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
    downloadCommande(req: AuthenticatedRequest, res: Response, orderId: number): Promise<void>;
    downloadBonLegacy(req: AuthenticatedRequest, res: Response, orderId: number): Promise<void>;
    deleteOrder(req: AuthenticatedRequest, orderId: number): Promise<{
        success: boolean;
        id: number;
    }>;
}
export {};
