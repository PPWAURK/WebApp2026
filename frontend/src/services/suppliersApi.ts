import { API_URL } from '../constants/config';
import { throwIfUnauthorized } from './authSession';

export type SupplierItem = {
  id: number;
  name: string;
};

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

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => {
      const raw = entry as { id?: unknown; name?: unknown };
      const id =
        typeof raw.id === 'number' && Number.isFinite(raw.id) ? raw.id : 0;
      const name = typeof raw.name === 'string' ? raw.name : '';
      return { id, name };
    })
    .filter((supplier) => supplier.id > 0 && supplier.name);
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

  const data = (await response.json()) as { id?: unknown; name?: unknown };
  const id = typeof data.id === 'number' && Number.isFinite(data.id) ? data.id : 0;
  const name = typeof data.name === 'string' ? data.name : '';

  if (!id || !name) {
    throw new Error('SUPPLIERS_CREATE_FAILED');
  }

  return { id, name };
}
