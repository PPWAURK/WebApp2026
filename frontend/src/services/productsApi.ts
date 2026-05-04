import { API_URL } from '../constants/config';
import { throwIfUnauthorized } from './authSession';

export type ProductItem = {
  id: number;
  supplierId: number;
  categoryId: number | null;
  reference: string | null;
  category: string;
  categoryNameZh: string;
  categoryNameFr: string;
  categorySortOrder: number | null;
  nameZh: string;
  nameFr: string | null;
  specification: string | null;
  unit: string | null;
  priceHt: number | null;
  specification2: string | null;
  unit2: string | null;
  priceHt2: number | null;
  specification3: string | null;
  unit3: string | null;
  priceHt3: number | null;
  requiresSpecificationSelection: boolean;
  specifications: ProductSpecificationItem[];
  image: string | null;
  isActive: boolean;
};

export type ProductCategoryItem = {
  id: number;
  supplierId: number;
  nameZh: string;
  nameFr: string;
  sortOrder: number;
  isPreset: boolean;
};

export type ProductSpecificationItem = {
  slot: number | null;
  specification: string | null;
  unit: string | null;
  priceHt: number | null;
};

type RawProduct = {
  id?: unknown;
  supplierId?: unknown;
  categoryId?: unknown;
  reference?: unknown;
  category?: unknown;
  categoryNameZh?: unknown;
  categoryNameFr?: unknown;
  categorySortOrder?: unknown;
  nameZh?: unknown;
  nameFr?: unknown;
  specification?: unknown;
  unit?: unknown;
  priceHt?: unknown;
  specification2?: unknown;
  unit2?: unknown;
  priceHt2?: unknown;
  specification3?: unknown;
  unit3?: unknown;
  priceHt3?: unknown;
  requiresSpecificationSelection?: unknown;
  specifications?: unknown;
  image?: unknown;
  isActive?: unknown;
};

type RawProductCategory = {
  id?: unknown;
  supplierId?: unknown;
  nameZh?: unknown;
  nameFr?: unknown;
  sortOrder?: unknown;
  isPreset?: unknown;
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

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return toNumber(value, 0);
}

function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function normalizeSpecification(
  raw: unknown,
): ProductSpecificationItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as {
    slot?: unknown;
    specification?: unknown;
    unit?: unknown;
    priceHt?: unknown;
  };
  const specification = normalizeOptionalText(candidate.specification);
  const unit = normalizeOptionalText(candidate.unit);
  const slot =
    typeof candidate.slot === 'number' && Number.isInteger(candidate.slot)
      ? candidate.slot
      : typeof candidate.slot === 'string' && candidate.slot.trim()
        ? toNumber(candidate.slot, 0)
        : null;

  if (specification === null && unit === null && candidate.priceHt == null) {
    return null;
  }

  return {
    slot: slot && slot > 0 ? slot : null,
    specification,
    unit,
    priceHt: toNullableNumber(candidate.priceHt),
  };
}

function buildFallbackSpecifications(raw: RawProduct): ProductSpecificationItem[] {
  return [
    {
      slot: 1,
      specification: normalizeOptionalText(raw.specification),
      unit: normalizeOptionalText(raw.unit),
      priceHt: toNullableNumber(raw.priceHt),
    },
    {
      slot: 2,
      specification: normalizeOptionalText(raw.specification2),
      unit: normalizeOptionalText(raw.unit2),
      priceHt: toNullableNumber(raw.priceHt2),
    },
    {
      slot: 3,
      specification: normalizeOptionalText(raw.specification3),
      unit: normalizeOptionalText(raw.unit3),
      priceHt: toNullableNumber(raw.priceHt3),
    },
  ].filter(
    (entry) =>
      entry.specification !== null ||
      entry.unit !== null ||
      entry.priceHt !== null,
  );
}

function normalizeProduct(raw: RawProduct, index: number): ProductItem {
  const id = toNumber(raw.id, index + 1);
  const nameZh =
    typeof raw.nameZh === 'string' && raw.nameZh.trim() ? raw.nameZh : `#${id}`;
  const nameFr = typeof raw.nameFr === 'string' ? raw.nameFr : null;
  const normalizedSpecifications = Array.isArray(raw.specifications)
    ? raw.specifications
        .map((item) => normalizeSpecification(item))
        .filter(
          (item): item is ProductSpecificationItem => item !== null,
        )
    : [];
  const specifications =
    normalizedSpecifications.length > 0
      ? normalizedSpecifications
      : buildFallbackSpecifications(raw);
  const fallbackPrice = toNullableNumber(raw.priceHt);
  const fallbackUnit = normalizeOptionalText(raw.unit);
  const fallbackSpecification = normalizeOptionalText(raw.specification);
  const hasAdditionalSpecificationOptions = specifications.some(
    (item) => item.slot !== null && item.slot !== 1,
  );

  return {
    id,
    supplierId: toNumber(raw.supplierId, 0),
    categoryId:
      raw.categoryId === null || raw.categoryId === undefined
        ? null
        : toNumber(raw.categoryId, 0),
    reference: typeof raw.reference === 'string' ? raw.reference : null,
    category: typeof raw.category === 'string' ? raw.category : '',
    categoryNameZh:
      typeof raw.categoryNameZh === 'string'
        ? raw.categoryNameZh
        : typeof raw.category === 'string'
          ? raw.category
          : '',
    categoryNameFr:
      typeof raw.categoryNameFr === 'string'
        ? raw.categoryNameFr
        : typeof raw.category === 'string'
          ? raw.category
          : '',
    categorySortOrder:
      raw.categorySortOrder === null || raw.categorySortOrder === undefined
        ? null
        : toNumber(raw.categorySortOrder, 0),
    nameZh,
    nameFr,
    specification: fallbackSpecification,
    unit: fallbackUnit,
    priceHt: fallbackPrice,
    specification2: normalizeOptionalText(raw.specification2),
    unit2: normalizeOptionalText(raw.unit2),
    priceHt2: toNullableNumber(raw.priceHt2),
    specification3: normalizeOptionalText(raw.specification3),
    unit3: normalizeOptionalText(raw.unit3),
    priceHt3: toNullableNumber(raw.priceHt3),
    requiresSpecificationSelection:
      typeof raw.requiresSpecificationSelection === 'boolean'
        ? raw.requiresSpecificationSelection
        : hasAdditionalSpecificationOptions,
    specifications:
      specifications.length > 0
        ? specifications
        : [
            {
              slot: null,
              specification: fallbackSpecification,
              unit: fallbackUnit,
              priceHt: fallbackPrice,
            },
          ],
    image: typeof raw.image === 'string' ? raw.image : null,
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
  };
}

function normalizeProductCategory(raw: RawProductCategory): ProductCategoryItem {
  return {
    id: toNumber(raw.id, 0),
    supplierId: toNumber(raw.supplierId, 0),
    nameZh: typeof raw.nameZh === 'string' ? raw.nameZh : '',
    nameFr: typeof raw.nameFr === 'string' ? raw.nameFr : '',
    sortOrder: toNumber(raw.sortOrder, 0),
    isPreset: raw.isPreset === true,
  };
}

export async function fetchProducts(
  token: string,
  options: { includeInactive?: boolean } = {},
): Promise<ProductItem[]> {
  const query = options.includeInactive ? '?includeInactive=true' : '';
  const response = await fetch(`${API_URL}/products${query}`, {
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
    categoryId?: number | null;
    reference?: string | null;
    category?: string;
    nameZh?: string;
    nameFr?: string | null;
    specification?: string | null;
    unit?: string | null;
    priceHt?: number | null;
    specification2?: string | null;
    unit2?: string | null;
    priceHt2?: number | null;
    specification3?: string | null;
    unit3?: string | null;
    priceHt3?: number | null;
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

export async function createProduct(
  token: string,
  payload: {
    supplierId: number;
    categoryId?: number | null;
    reference?: string | null;
    category?: string;
    nameZh: string;
    nameFr?: string | null;
    specification?: string | null;
    unit?: string | null;
    priceHt?: number | null;
    specification2?: string | null;
    unit2?: string | null;
    priceHt2?: number | null;
    specification3?: string | null;
    unit3?: string | null;
    priceHt3?: number | null;
    image?: string | null;
  },
): Promise<ProductItem> {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
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
      : data.message ?? 'PRODUCTS_CREATE_FAILED';
    throw new Error(message);
  }

  const data = (await response.json()) as RawProduct;
  return normalizeProduct(data, 0);
}

export async function fetchProductCategories(
  token: string,
  supplierId: number,
): Promise<ProductCategoryItem[]> {
  const response = await fetch(
    `${API_URL}/products/categories?supplierId=${supplierId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  throwIfUnauthorized(response);

  const data = (await response.json()) as
    | RawProductCategory[]
    | { message?: string | string[] };

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'PRODUCT_CATEGORIES_FETCH_FAILED');
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) =>
    normalizeProductCategory(entry as RawProductCategory),
  );
}

export async function createProductCategory(
  token: string,
  payload: {
    supplierId: number;
    nameZh: string;
    nameFr: string;
  },
): Promise<ProductCategoryItem> {
  const response = await fetch(`${API_URL}/products/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  throwIfUnauthorized(response);

  const data = (await response.json()) as
    | RawProductCategory
    | { message?: string | string[] };

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'PRODUCT_CATEGORY_CREATE_FAILED');
    throw new Error(message);
  }

  return normalizeProductCategory(data as RawProductCategory);
}

export async function updateProductCategory(
  token: string,
  categoryId: number,
  payload: {
    nameZh?: string;
    nameFr?: string;
    sortOrder?: number;
  },
): Promise<ProductCategoryItem> {
  const response = await fetch(`${API_URL}/products/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  throwIfUnauthorized(response);

  const data = (await response.json()) as
    | RawProductCategory
    | { message?: string | string[] };

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'PRODUCT_CATEGORY_UPDATE_FAILED');
    throw new Error(message);
  }

  return normalizeProductCategory(data as RawProductCategory);
}

export async function deleteProductCategory(
  token: string,
  categoryId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/products/categories/${categoryId}`, {
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
    : (data.message ?? 'PRODUCT_CATEGORY_DELETE_FAILED');
  throw new Error(message);
}

export async function updateProductAvailability(
  token: string,
  productId: number,
  isActive: boolean,
): Promise<ProductItem> {
  const response = await fetch(`${API_URL}/products/${productId}/availability`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });

  throwIfUnauthorized(response);

  if (!response.ok) {
    const data = (await response.json()) as { message?: string | string[] };
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? 'PRODUCT_AVAILABILITY_UPDATE_FAILED';
    throw new Error(message);
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
