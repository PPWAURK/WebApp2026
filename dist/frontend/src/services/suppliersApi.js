"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSuppliers = fetchSuppliers;
exports.createSupplier = createSupplier;
const config_1 = require("../constants/config");
const authSession_1 = require("./authSession");
async function fetchSuppliers(token) {
    const response = await fetch(`${config_1.API_URL}/suppliers`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        throw new Error('SUPPLIERS_FETCH_FAILED');
    }
    const data = (await response.json());
    if (!Array.isArray(data)) {
        return [];
    }
    return data
        .map((entry) => {
        const raw = entry;
        const id = typeof raw.id === 'number' && Number.isFinite(raw.id) ? raw.id : 0;
        const name = typeof raw.name === 'string' ? raw.name : '';
        return { id, name };
    })
        .filter((supplier) => supplier.id > 0 && supplier.name);
}
async function createSupplier(token, payload) {
    const response = await fetch(`${config_1.API_URL}/suppliers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        throw new Error('SUPPLIERS_CREATE_FAILED');
    }
    const data = (await response.json());
    const id = typeof data.id === 'number' && Number.isFinite(data.id) ? data.id : 0;
    const name = typeof data.name === 'string' ? data.name : '';
    if (!id || !name) {
        throw new Error('SUPPLIERS_CREATE_FAILED');
    }
    return { id, name };
}
//# sourceMappingURL=suppliersApi.js.map