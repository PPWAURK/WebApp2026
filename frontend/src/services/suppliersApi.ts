import { API_URL } from '../constants/config';

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
