import { API_URL } from '../constants/config';
import { throwIfUnauthorized } from './authSession';

export type ProductItem = {
  id: number;
  supplierId: number;
  reference: string | null;
  category: string;
  nameZh: string;
  nameFr: string | null;
  specification: string | null;
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
  specification?: unknown;
  unit?: unknown;
  priceHt?: unknown;
  image?: unknown;
};

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: File;
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
    specification: typeof raw.specification === 'string' ? raw.specification : null,
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

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error('PRODUCTS_FETCH_FAILED');
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry, index) => normalizeProduct(entry as RawProduct, index));
}

export async function updateProduct(
  token: string,
  productId: number,
  payload: {
    supplierId?: number;
    reference?: string | null;
    category?: string;
    nameZh?: string;
    nameFr?: string | null;
    specification?: string | null;
    unit?: string | null;
    priceHt?: number | null;
    image?: string | null;
  },
): Promise<ProductItem> {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error('PRODUCTS_UPDATE_FAILED');
  }

  const data = (await response.json()) as RawProduct;
  return normalizeProduct(data, 0);
}

export async function deleteProduct(token: string, productId: number): Promise<void> {
  const response = await fetch(`${API_URL}/products/${productId}`, {
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
    : data.message ?? 'PRODUCT_DELETE_FAILED';
  throw new Error(message);
}

export async function uploadProductImage(
  token: string,
  productId: number,
  file: PickedFile,
): Promise<string> {
  const formData = new FormData();

  if (file.file) {
    formData.append('file', file.file);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'image/jpeg',
    } as never);
  }

  const response = await fetch(`${API_URL}/products/${productId}/image`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error('PRODUCTS_IMAGE_UPLOAD_FAILED');
  }

  const data = (await response.json()) as { image?: unknown };
  if (typeof data.image !== 'string') {
    throw new Error('PRODUCTS_IMAGE_UPLOAD_FAILED');
  }

  return data.image;
}
