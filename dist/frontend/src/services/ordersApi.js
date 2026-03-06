"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.fetchOrders = fetchOrders;
exports.deleteOrder = deleteOrder;
exports.fetchTopOrderedProductsBySupplier = fetchTopOrderedProductsBySupplier;
exports.fetchTopOrderedProductMonths = fetchTopOrderedProductMonths;
exports.buildOrderBonUrl = buildOrderBonUrl;
exports.fetchOrderHistoryAnalytics = fetchOrderHistoryAnalytics;
const config_1 = require("../constants/config");
const authSession_1 = require("./authSession");
function toNumber(value, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return fallback;
}
function normalizeOrderSummary(raw) {
    const commandeUrl = typeof raw.commandeUrl === 'string'
        ? raw.commandeUrl
        : typeof raw.bonUrl === 'string'
            ? raw.bonUrl
            : '';
    return {
        id: toNumber(raw.id, 0),
        number: typeof raw.number === 'string' ? raw.number : '',
        supplierId: toNumber(raw.supplierId, 0),
        supplierName: typeof raw.supplierName === 'string' ? raw.supplierName : '',
        deliveryDate: typeof raw.deliveryDate === 'string' ? raw.deliveryDate : '',
        deliveryAddress: typeof raw.deliveryAddress === 'string' ? raw.deliveryAddress : '',
        totalItems: toNumber(raw.totalItems, 0),
        totalAmount: toNumber(raw.totalAmount, 0),
        bonUrl: commandeUrl,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    };
}
async function createOrder(token, payload) {
    const response = await fetch(`${config_1.API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            deliveryDate: payload.deliveryDate,
            items: payload.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        }),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'ORDER_CREATE_FAILED';
        throw new Error(message);
    }
    const normalized = normalizeOrderSummary(data);
    return {
        id: normalized.id,
        number: normalized.number,
        bonUrl: normalized.bonUrl,
    };
}
async function fetchOrders(token) {
    const response = await fetch(`${config_1.API_URL}/orders`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'ORDERS_FETCH_FAILED';
        throw new Error(message);
    }
    if (!Array.isArray(data)) {
        return [];
    }
    return data.map((item) => normalizeOrderSummary(item));
}
async function deleteOrder(token, orderId) {
    const response = await fetch(`${config_1.API_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (response.ok) {
        return;
    }
    (0, authSession_1.throwIfUnauthorized)(response);
    const data = (await response.json());
    const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message ?? 'ORDER_DELETE_FAILED';
    throw new Error(message);
}
async function fetchTopOrderedProductsBySupplier(token, supplierId, month) {
    const query = new URLSearchParams();
    if (typeof supplierId === 'number' && Number.isInteger(supplierId) && supplierId > 0) {
        query.set('supplierId', String(supplierId));
    }
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
        query.set('month', month);
    }
    const queryString = query.toString();
    const response = await fetch(`${config_1.API_URL}/orders/dashboard/top-products${queryString ? `?${queryString}` : ''}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Failed to load top ordered products';
        throw new Error(message);
    }
    return data;
}
async function fetchTopOrderedProductMonths(token, supplierId) {
    const query = new URLSearchParams();
    if (typeof supplierId === 'number' && Number.isInteger(supplierId) && supplierId > 0) {
        query.set('supplierId', String(supplierId));
    }
    const queryString = query.toString();
    const response = await fetch(`${config_1.API_URL}/orders/dashboard/top-product-months${queryString ? `?${queryString}` : ''}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Failed to load top ordered months';
        throw new Error(message);
    }
    if (!Array.isArray(data)) {
        return [];
    }
    return data.filter((value) => typeof value === 'string');
}
function buildOrderBonUrl(orderId) {
    return `${config_1.API_URL}/orders/${orderId}/commande`;
}
async function fetchOrderHistoryAnalytics(token, options) {
    const query = new URLSearchParams();
    if (options?.supplierId !== undefined &&
        Number.isInteger(options.supplierId) &&
        options.supplierId > 0) {
        query.set('supplierId', String(options.supplierId));
    }
    if (options?.period) {
        query.set('period', options.period);
    }
    const queryString = query.toString();
    const response = await fetch(`${config_1.API_URL}/orders/history/analytics${queryString ? `?${queryString}` : ''}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'ORDER_HISTORY_ANALYTICS_FAILED';
        throw new Error(message);
    }
    return data;
}
//# sourceMappingURL=ordersApi.js.map