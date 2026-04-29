import { API_URL } from '../constants/config';
import { throwIfUnauthorized } from './authSession';

export type SupplierItem = {
  id: number;
  name: string;
  includeAllProductsInOrder: boolean;
  orderNotice: string;
};

type RawSupplier = {
  id?: unknown;
  name?: unknown;
  includeAllProductsInOrder?: unknown;
  orderNotice?: unknown;
};

function normalizeSupplier(raw: RawSupplier): SupplierItem | null {
  const id = typeof raw.id === 'number' && Number.isFinite(raw.id) ? raw.id : 0;
  const name = typeof raw.name === 'string' ? raw.name : '';

  if (id <= 0 || !name) {
    return null;
  }

  return {
    id,
    name,
    includeAllProductsInOrder: raw.includeAllProductsInOrder === true,
    orderNotice: typeof raw.orderNotice === 'string' ? raw.orderNotice : '',
  };
}

function normalizeSupplierList(data: unknown): SupplierItem[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => normalizeSupplier(entry as RawSupplier))
    .filter((supplier): supplier is SupplierItem => supplier !== null);
}

export async function fetchSuppliers(token: string): Promise<SupplierItem[]> {
  const response = await fetch(`${API_URL}/suppliers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error('SUPPLIERS_FETCH_FAILED');
  }

  return normalizeSupplierList(await response.json());
}

export async function createSupplier(
  token: string,
  payload: { name: string },
): Promise<SupplierItem> {
  const response = await fetch(`${API_URL}/suppliers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error('SUPPLIERS_CREATE_FAILED');
  }

  const supplier = normalizeSupplier((await response.json()) as RawSupplier);

  if (!supplier) {
    throw new Error('SUPPLIERS_CREATE_FAILED');
  }

  return supplier;
}

export async function reorderSuppliers(
  token: string,
  payload: { supplierIds: number[] },
): Promise<SupplierItem[]> {
  const response = await fetch(`${API_URL}/suppliers/order`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  throwIfUnauthorized(response);

  if (!response.ok) {
    const data = (await response.json()) as { message?: string | string[] };
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? 'SUPPLIERS_REORDER_FAILED';
    throw new Error(message);
  }

  const suppliers = normalizeSupplierList(await response.json());
  if (payload.supplierIds.length > 0 && suppliers.length !== payload.supplierIds.length) {
    throw new Error('SUPPLIERS_REORDER_FAILED');
  }

  return suppliers;
}

export async function deleteSupplier(token: string, supplierId: number): Promise<void> {
  const response = await fetch(`${API_URL}/suppliers/${supplierId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  throwIfUnauthorized(response);

  if (response.ok) {
    return;
  }

  const data = (await response.json()) as { message?: string | string[] };
  const message = Array.isArray(data.message)
    ? data.message.join(', ')
    : data.message ?? 'SUPPLIERS_DELETE_FAILED';
  throw new Error(message);
}

export async function updateSupplierOrderSettings(
  token: string,
  supplierId: number,
  payload: { includeAllProductsInOrder: boolean; orderNotice?: string },
): Promise<SupplierItem> {
  const response = await fetch(
    `${API_URL}/suppliers/${supplierId}/order-settings`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  throwIfUnauthorized(response);

  const data = (await response.json()) as RawSupplier & {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? 'SUPPLIER_ORDER_SETTINGS_UPDATE_FAILED';
    throw new Error(message);
  }

  const supplier = normalizeSupplier(data);
  if (!supplier) {
    throw new Error('SUPPLIER_ORDER_SETTINGS_UPDATE_FAILED');
  }

  return supplier;
}
