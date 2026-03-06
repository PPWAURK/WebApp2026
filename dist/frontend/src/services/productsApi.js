"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProducts = fetchProducts;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.uploadProductImage = uploadProductImage;
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
function normalizeProduct(raw, index) {
    const id = toNumber(raw.id, index + 1);
    const nameZh = typeof raw.nameZh === 'string' && raw.nameZh.trim() ? raw.nameZh : `#${id}`;
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
async function fetchProducts(token) {
    const response = await fetch(`${config_1.API_URL}/products`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        throw new Error('PRODUCTS_FETCH_FAILED');
    }
    const data = (await response.json());
    if (!Array.isArray(data)) {
        return [];
    }
    return data.map((entry, index) => normalizeProduct(entry, index));
}
async function updateProduct(token, productId, payload) {
    const response = await fetch(`${config_1.API_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        throw new Error('PRODUCTS_UPDATE_FAILED');
    }
    const data = (await response.json());
    return normalizeProduct(data, 0);
}
async function deleteProduct(token, productId) {
    const response = await fetch(`${config_1.API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    (0, authSession_1.throwIfUnauthorized)(response);
    if (response.ok) {
        return;
    }
    const data = (await response.json());
    const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message ?? 'PRODUCT_DELETE_FAILED';
    throw new Error(message);
}
async function uploadProductImage(token, productId, file) {
    const formData = new FormData();
    if (file.file) {
        formData.append('file', file.file);
    }
    else {
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType ?? 'image/jpeg',
        });
    }
    const response = await fetch(`${config_1.API_URL}/products/${productId}/image`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        throw new Error('PRODUCTS_IMAGE_UPLOAD_FAILED');
    }
    const data = (await response.json());
    if (typeof data.image !== 'string') {
        throw new Error('PRODUCTS_IMAGE_UPLOAD_FAILED');
    }
    return data.image;
}
//# sourceMappingURL=productsApi.js.map