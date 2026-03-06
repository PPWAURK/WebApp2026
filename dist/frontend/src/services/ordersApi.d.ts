import type { OrderRecapItem } from '../types/order';
export type OrderSummary = {
    id: number;
    number: string;
    supplierId: number;
    supplierName: string;
    deliveryDate: string;
    deliveryAddress: string;
    totalItems: number;
    totalAmount: number;
    bonUrl: string;
    createdAt: string;
};
export type TopOrderedProduct = {
    productId: number;
    supplierId: number;
    supplierName: string;
    month: string;
    nameFr: string;
    nameZh: string;
    totalQuantity: number;
    orderCount: number;
};
export type CreatedOrderResult = {
    id: number;
    number: string;
    bonUrl: string;
};
export type OrderHistoryAnalytics = {
    period: '7d' | '30d' | 'this_month' | 'last_month' | 'all';
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
    topProducts: Array<{
        productId: number;
        totalQuantity: number;
        nameFr: string;
        nameZh: string;
    }>;
    busiestDay: {
        date: string;
        totalItems: number;
        orders: number;
    } | null;
    monthlyTrend: Array<{
        month: string;
        orders: number;
        totalItems: number;
        totalAmount: number;
    }>;
};
export declare function createOrder(token: string, payload: {
    deliveryDate: string;
    items: OrderRecapItem[];
}): Promise<CreatedOrderResult>;
export declare function fetchOrders(token: string): Promise<OrderSummary[]>;
export declare function deleteOrder(token: string, orderId: number): Promise<void>;
export declare function fetchTopOrderedProductsBySupplier(token: string, supplierId?: number, month?: string): Promise<TopOrderedProduct[]>;
export declare function fetchTopOrderedProductMonths(token: string, supplierId?: number): Promise<string[]>;
export declare function buildOrderBonUrl(orderId: number): string;
export declare function fetchOrderHistoryAnalytics(token: string, options?: {
    supplierId?: number;
    period?: '7d' | '30d' | 'this_month' | 'last_month' | 'all';
}): Promise<OrderHistoryAnalytics>;
