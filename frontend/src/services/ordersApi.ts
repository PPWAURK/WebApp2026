import { API_URL } from '../constants/config';
import type { OrderRecapItem } from '../types/order';
import { throwIfUnauthorized } from './authSession';

type RawOrderSummary = {
  id?: unknown;
  number?: unknown;
  supplierId?: unknown;
  supplierName?: unknown;
  deliveryDate?: unknown;
  deliveryAddress?: unknown;
  totalItems?: unknown;
  totalAmount?: unknown;
  bonUrl?: unknown;
  commandeUrl?: unknown;
  createdAt?: unknown;
};

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

export type CreatedOrderResult = {
  id: number;
  number: string;
  bonUrl: string;
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
    deliveryDate: typeof raw.deliveryDate === 'string' ? raw.deliveryDate : '',
    deliveryAddress:
      typeof raw.deliveryAddress === 'string' ? raw.deliveryAddress : '',
    totalItems: toNumber(raw.totalItems, 0),
    totalAmount: toNumber(raw.totalAmount, 0),
    bonUrl: commandeUrl,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
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
      : errorData.message ?? 'ORDER_CREATE_FAILED';
    throw new Error(message);
  }

  const normalized = normalizeOrderSummary(data as RawOrderSummary);

  return {
    id: normalized.id,
    number: normalized.number,
    bonUrl: normalized.bonUrl,
  };
}

export async function fetchOrders(token: string): Promise<OrderSummary[]> {
  const response = await fetch(`${API_URL}/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as unknown;

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'ORDERS_FETCH_FAILED';
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => normalizeOrderSummary(item as RawOrderSummary));
}

export async function deleteOrder(token: string, orderId: number): Promise<void> {
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
    : data.message ?? 'ORDER_DELETE_FAILED';
  throw new Error(message);
}

export function buildOrderBonUrl(orderId: number) {
  return `${API_URL}/orders/${orderId}/commande`;
}
