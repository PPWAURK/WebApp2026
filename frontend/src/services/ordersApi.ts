import { API_URL } from '../constants/config';
import type { OrderRecapItem } from '../types/order';
import { throwIfUnauthorized } from './authSession';

type RawOrderSummary = {
  id?: unknown;
  number?: unknown;
  supplierId?: unknown;
  supplierName?: unknown;
  restaurantId?: unknown;
  restaurantName?: unknown;
  deliveryDate?: unknown;
  deliveryAddress?: unknown;
  totalItems?: unknown;
  totalAmount?: unknown;
  bonUrl?: unknown;
  commandeUrl?: unknown;
  createdAt?: unknown;
  createdBy?: unknown;
};

type RawOrderCreatedBy = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
};

type RawOrderReturnDraftItem = {
  purchaseOrderItemId?: unknown;
  productId?: unknown;
  specificationSlot?: unknown;
  category?: unknown;
  nameZh?: unknown;
  nameFr?: unknown;
  specification?: unknown;
  unit?: unknown;
  orderedQuantity?: unknown;
  returnedQuantity?: unknown;
  remainingQuantity?: unknown;
};

type RawOrderReturnDraft = {
  orderId?: unknown;
  orderNumber?: unknown;
  supplierId?: unknown;
  supplierName?: unknown;
  deliveryDate?: unknown;
  items?: unknown;
};

type RawOrderReturnSummaryItem = {
  specificationSlot?: unknown;
  quantity?: unknown;
  nameZh?: unknown;
  nameFr?: unknown;
  specification?: unknown;
  unit?: unknown;
  photos?: unknown;
};

type RawOrderReturnSummaryPhoto = {
  documentId?: unknown;
  originalName?: unknown;
  fileUrl?: unknown;
};

type RawOrderReturnSummary = {
  id?: unknown;
  orderId?: unknown;
  orderNumber?: unknown;
  supplierId?: unknown;
  supplierName?: unknown;
  restaurantId?: unknown;
  restaurantName?: unknown;
  deliveryDate?: unknown;
  reason?: unknown;
  notes?: unknown;
  totalItems?: unknown;
  createdAt?: unknown;
  items?: unknown;
};

export type OrderSummary = {
  id: number;
  number: string;
  supplierId: number;
  supplierName: string;
  restaurantId: number;
  restaurantName: string;
  deliveryDate: string;
  deliveryAddress: string;
  totalItems: number;
  totalAmount: number;
  bonUrl: string;
  createdAt: string;
  createdBy: {
    id: number;
    name: string | null;
    email: string;
  };
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

export type OrderReturnDraftItem = {
  purchaseOrderItemId: number;
  productId: number;
  specificationSlot: number | null;
  category: string;
  nameZh: string;
  nameFr: string;
  specification: string;
  unit: string;
  orderedQuantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
};

export type OrderReturnDraft = {
  orderId: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  deliveryDate: string;
  items: OrderReturnDraftItem[];
};

export type OrderReturnSummaryItem = {
  specificationSlot: number | null;
  quantity: number;
  nameZh: string;
  nameFr: string;
  specification: string;
  unit: string;
  photos: OrderReturnSummaryPhoto[];
};

export type OrderReturnSummaryPhoto = {
  documentId: number;
  originalName: string;
  fileUrl: string;
};

export type OrderReturnSummary = {
  id: number;
  orderId: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  restaurantId: number;
  restaurantName: string;
  deliveryDate: string;
  reason: string;
  notes: string;
  totalItems: number;
  createdAt: string;
  items: OrderReturnSummaryItem[];
};

export type CreateOrderReturnPayload = {
  orderId: number;
  reason: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId: number;
    quantity: number;
    photoDocumentIds?: number[];
  }>;
};

export type CreatedOrderReturnResult = {
  id: number;
  orderId: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  reason: string;
  notes: string;
  totalItems: number;
  createdAt: string;
};

export type DeletedOrderReturnResult = {
  success: boolean;
  id: number;
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

function toNumber(value: unknown, fallback = 0) {
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

function normalizeOrderSummary(raw: RawOrderSummary): OrderSummary {
  const commandeUrl =
    typeof raw.commandeUrl === 'string'
      ? raw.commandeUrl
      : typeof raw.bonUrl === 'string'
        ? raw.bonUrl
        : '';

  return {
    id: toNumber(raw.id, 0),
    number: typeof raw.number === 'string' ? raw.number : '',
    supplierId: toNumber(raw.supplierId, 0),
    supplierName: typeof raw.supplierName === 'string' ? raw.supplierName : '',
    restaurantId: toNumber(raw.restaurantId, 0),
    restaurantName:
      typeof raw.restaurantName === 'string' ? raw.restaurantName : '',
    deliveryDate: typeof raw.deliveryDate === 'string' ? raw.deliveryDate : '',
    deliveryAddress:
      typeof raw.deliveryAddress === 'string' ? raw.deliveryAddress : '',
    totalItems: toNumber(raw.totalItems, 0),
    totalAmount: toNumber(raw.totalAmount, 0),
    bonUrl: commandeUrl,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    createdBy: normalizeOrderCreatedBy(raw.createdBy as RawOrderCreatedBy),
  };
}

function normalizeOrderCreatedBy(raw: RawOrderCreatedBy | undefined) {
  return {
    id: toNumber(raw?.id, 0),
    name: typeof raw?.name === 'string' ? raw.name : null,
    email: typeof raw?.email === 'string' ? raw.email : '',
  };
}

function normalizeOrderReturnDraftItem(
  raw: RawOrderReturnDraftItem,
): OrderReturnDraftItem {
  return {
    purchaseOrderItemId: toNumber(raw.purchaseOrderItemId, 0),
    productId: toNumber(raw.productId, 0),
    specificationSlot:
      raw.specificationSlot === null || raw.specificationSlot === undefined
        ? null
        : toNumber(raw.specificationSlot, 0),
    category: typeof raw.category === 'string' ? raw.category : '',
    nameZh: typeof raw.nameZh === 'string' ? raw.nameZh : '',
    nameFr: typeof raw.nameFr === 'string' ? raw.nameFr : '',
    specification:
      typeof raw.specification === 'string' ? raw.specification : '',
    unit: typeof raw.unit === 'string' ? raw.unit : '',
    orderedQuantity: toNumber(raw.orderedQuantity, 0),
    returnedQuantity: toNumber(raw.returnedQuantity, 0),
    remainingQuantity: toNumber(raw.remainingQuantity, 0),
  };
}

function normalizeOrderReturnDraft(raw: RawOrderReturnDraft): OrderReturnDraft {
  const items = Array.isArray(raw.items)
    ? raw.items.map((item) =>
        normalizeOrderReturnDraftItem(item as RawOrderReturnDraftItem),
      )
    : [];

  return {
    orderId: toNumber(raw.orderId, 0),
    orderNumber: typeof raw.orderNumber === 'string' ? raw.orderNumber : '',
    supplierId: toNumber(raw.supplierId, 0),
    supplierName: typeof raw.supplierName === 'string' ? raw.supplierName : '',
    deliveryDate: typeof raw.deliveryDate === 'string' ? raw.deliveryDate : '',
    items,
  };
}

function normalizeOrderReturnSummaryItem(
  raw: RawOrderReturnSummaryItem,
): OrderReturnSummaryItem {
  return {
    specificationSlot:
      raw.specificationSlot === null || raw.specificationSlot === undefined
        ? null
        : toNumber(raw.specificationSlot, 0),
    quantity: toNumber(raw.quantity, 0),
    nameZh: typeof raw.nameZh === 'string' ? raw.nameZh : '',
    nameFr: typeof raw.nameFr === 'string' ? raw.nameFr : '',
    specification:
      typeof raw.specification === 'string' ? raw.specification : '',
    unit: typeof raw.unit === 'string' ? raw.unit : '',
    photos: Array.isArray(raw.photos)
      ? raw.photos.map((photo) =>
          normalizeOrderReturnSummaryPhoto(photo as RawOrderReturnSummaryPhoto),
        )
      : [],
  };
}

function normalizeOrderReturnSummaryPhoto(
  raw: RawOrderReturnSummaryPhoto,
): OrderReturnSummaryPhoto {
  return {
    documentId: toNumber(raw.documentId, 0),
    originalName: typeof raw.originalName === 'string' ? raw.originalName : '',
    fileUrl: typeof raw.fileUrl === 'string' ? raw.fileUrl : '',
  };
}

function normalizeOrderReturnSummary(
  raw: RawOrderReturnSummary,
): OrderReturnSummary {
  const items = Array.isArray(raw.items)
    ? raw.items.map((item) =>
        normalizeOrderReturnSummaryItem(item as RawOrderReturnSummaryItem),
      )
    : [];

  return {
    id: toNumber(raw.id, 0),
    orderId: toNumber(raw.orderId, 0),
    orderNumber: typeof raw.orderNumber === 'string' ? raw.orderNumber : '',
    supplierId: toNumber(raw.supplierId, 0),
    supplierName: typeof raw.supplierName === 'string' ? raw.supplierName : '',
    restaurantId: toNumber(raw.restaurantId, 0),
    restaurantName:
      typeof raw.restaurantName === 'string' ? raw.restaurantName : '',
    deliveryDate: typeof raw.deliveryDate === 'string' ? raw.deliveryDate : '',
    reason: typeof raw.reason === 'string' ? raw.reason : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    totalItems: toNumber(raw.totalItems, 0),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    items,
  };
}

export async function createOrder(
  token: string,
  payload: {
    deliveryDate: string;
    items: OrderRecapItem[];
  },
): Promise<CreatedOrderResult> {
  const response = await fetch(`${API_URL}/orders`, {
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
        specificationSlot: item.specificationSlot ?? undefined,
      })),
    }),
  });

  const data = (await response.json()) as
    | RawOrderSummary
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'ORDER_CREATE_FAILED');
    throw new Error(message);
  }

  const normalized = normalizeOrderSummary(data as RawOrderSummary);

  return {
    id: normalized.id,
    number: normalized.number,
    bonUrl: normalized.bonUrl,
  };
}

export async function fetchOrders(
  token: string,
  options?: { restaurantId?: number },
): Promise<OrderSummary[]> {
  const query = new URLSearchParams();
  if (
    options?.restaurantId !== undefined &&
    Number.isInteger(options.restaurantId) &&
    options.restaurantId > 0
  ) {
    query.set('restaurantId', String(options.restaurantId));
  }

  const queryString = query.toString();
  const response = await fetch(
    `${API_URL}/orders${queryString ? `?${queryString}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json()) as unknown;

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'ORDERS_FETCH_FAILED');
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => normalizeOrderSummary(item as RawOrderSummary));
}

export async function deleteOrder(
  token: string,
  orderId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return;
  }

  throwIfUnauthorized(response);

  const data = (await response.json()) as { message?: string | string[] };
  const message = Array.isArray(data.message)
    ? data.message.join(', ')
    : (data.message ?? 'ORDER_DELETE_FAILED');
  throw new Error(message);
}

export async function fetchOrderReturnDraft(
  token: string,
  orderId: number,
): Promise<OrderReturnDraft> {
  const response = await fetch(`${API_URL}/orders/${orderId}/return-draft`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | RawOrderReturnDraft
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'ORDER_RETURN_DRAFT_FAILED');
    throw new Error(message);
  }

  return normalizeOrderReturnDraft(data as RawOrderReturnDraft);
}

export async function createOrderReturn(
  token: string,
  payload: CreateOrderReturnPayload,
): Promise<CreatedOrderReturnResult> {
  const response = await fetch(`${API_URL}/orders/returns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | RawOrderReturnSummary
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'ORDER_RETURN_CREATE_FAILED');
    throw new Error(message);
  }

  const normalized = normalizeOrderReturnSummary(data as RawOrderReturnSummary);

  return {
    id: normalized.id,
    orderId: normalized.orderId,
    orderNumber: normalized.orderNumber,
    supplierId: normalized.supplierId,
    supplierName: normalized.supplierName,
    reason: normalized.reason,
    notes: normalized.notes,
    totalItems: normalized.totalItems,
    createdAt: normalized.createdAt,
  };
}

export async function deleteOrderReturn(
  token: string,
  returnId: number,
): Promise<DeletedOrderReturnResult> {
  const response = await fetch(`${API_URL}/orders/returns/${returnId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as {
    success?: unknown;
    id?: unknown;
    message?: string | string[];
  };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : (data.message ?? 'ORDER_RETURN_DELETE_FAILED');
    throw new Error(message);
  }

  return {
    success: Boolean(data.success),
    id: toNumber(data.id, returnId),
  };
}

export async function fetchOrderReturns(
  token: string,
  options?: { restaurantId?: number },
): Promise<OrderReturnSummary[]> {
  const query = new URLSearchParams();
  if (
    options?.restaurantId !== undefined &&
    Number.isInteger(options.restaurantId) &&
    options.restaurantId > 0
  ) {
    query.set('restaurantId', String(options.restaurantId));
  }

  const queryString = query.toString();
  const response = await fetch(
    `${API_URL}/orders/returns${queryString ? `?${queryString}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json()) as unknown;

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'ORDER_RETURNS_FETCH_FAILED');
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) =>
    normalizeOrderReturnSummary(item as RawOrderReturnSummary),
  );
}

export async function fetchTopOrderedProductsBySupplier(
  token: string,
  supplierId?: number,
  month?: string,
  restaurantId?: number,
): Promise<TopOrderedProduct[]> {
  const query = new URLSearchParams();
  if (
    typeof supplierId === 'number' &&
    Number.isInteger(supplierId) &&
    supplierId > 0
  ) {
    query.set('supplierId', String(supplierId));
  }
  if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
    query.set('month', month);
  }
  if (
    typeof restaurantId === 'number' &&
    Number.isInteger(restaurantId) &&
    restaurantId > 0
  ) {
    query.set('restaurantId', String(restaurantId));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_URL}/orders/dashboard/top-products${queryString ? `?${queryString}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json()) as
    | TopOrderedProduct[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to load top ordered products');
    throw new Error(message);
  }

  return data as TopOrderedProduct[];
}

export async function fetchTopOrderedProductMonths(
  token: string,
  supplierId?: number,
  restaurantId?: number,
): Promise<string[]> {
  const query = new URLSearchParams();
  if (
    typeof supplierId === 'number' &&
    Number.isInteger(supplierId) &&
    supplierId > 0
  ) {
    query.set('supplierId', String(supplierId));
  }
  if (
    typeof restaurantId === 'number' &&
    Number.isInteger(restaurantId) &&
    restaurantId > 0
  ) {
    query.set('restaurantId', String(restaurantId));
  }

  const queryString = query.toString();
  const response = await fetch(
    `${API_URL}/orders/dashboard/top-product-months${queryString ? `?${queryString}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json()) as unknown;

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to load top ordered months');
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((value): value is string => typeof value === 'string');
}

export function buildOrderBonUrl(orderId: number) {
  return `${API_URL}/orders/${orderId}/commande`;
}

export async function fetchOrderHistoryAnalytics(
  token: string,
  options?: {
    supplierId?: number;
    restaurantId?: number;
    period?: '7d' | '30d' | 'this_month' | 'last_month' | 'all';
  },
): Promise<OrderHistoryAnalytics> {
  const query = new URLSearchParams();
  if (
    options?.supplierId !== undefined &&
    Number.isInteger(options.supplierId) &&
    options.supplierId > 0
  ) {
    query.set('supplierId', String(options.supplierId));
  }
  if (options?.period) {
    query.set('period', options.period);
  }
  if (
    options?.restaurantId !== undefined &&
    Number.isInteger(options.restaurantId) &&
    options.restaurantId > 0
  ) {
    query.set('restaurantId', String(options.restaurantId));
  }

  const queryString = query.toString();
  const response = await fetch(
    `${API_URL}/orders/history/analytics${queryString ? `?${queryString}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json()) as
    | OrderHistoryAnalytics
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'ORDER_HISTORY_ANALYTICS_FAILED');
    throw new Error(message);
  }

  return data as OrderHistoryAnalytics;
}
