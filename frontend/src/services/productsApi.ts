import { API_URL } from '../constants/config';

export type ProductItem = {
  id: number;
  supplierId: number;
  reference: string | null;
  category: string;
  nameZh: string;
  nameFr: string | null;
  unit: string | null;
  priceHt: number | null;
  image: string | null;
};

type RawProduct = {
  id?: unknown;
  supplierId?: unknown;
  reference?: unknown;
  category?: unknown;
  nameZh?: unknown;
  nameFr?: unknown;
  unit?: unknown;
  priceHt?: unknown;
  image?: unknown;
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

function normalizeProduct(raw: RawProduct, index: number): ProductItem {
  const id = toNumber(raw.id, index + 1);
  const nameZh =
    typeof raw.nameZh === 'string' && raw.nameZh.trim() ? raw.nameZh : `#${id}`;
  const nameFr = typeof raw.nameFr === 'string' ? raw.nameFr : null;

  return {
    id,
    supplierId: toNumber(raw.supplierId, 0),
    reference: typeof raw.reference === 'string' ? raw.reference : null,
    category: typeof raw.category === 'string' ? raw.category : '',
    nameZh,
    nameFr,
    unit: typeof raw.unit === 'string' ? raw.unit : null,
    priceHt: raw.priceHt === null || raw.priceHt === undefined ? null : toNumber(raw.priceHt, 0),
    image: typeof raw.image === 'string' ? raw.image : null,
  };
}

export async function fetchProducts(token: string): Promise<ProductItem[]> {
  const response = await fetch(`${API_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('PRODUCTS_FETCH_FAILED');
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry, index) => normalizeProduct(entry as RawProduct, index));
}
