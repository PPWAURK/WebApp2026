"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRestaurants = fetchRestaurants;
exports.createRestaurant = createRestaurant;
const config_1 = require("../constants/config");
const authSession_1 = require("./authSession");
async function fetchRestaurants() {
    const response = await fetch(`${config_1.API_URL}/restaurants`);
    const data = (await response.json());
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Failed to load restaurants';
        throw new Error(message);
    }
    return data;
}
async function createRestaurant(token, payload) {
    const response = await fetch(`${config_1.API_URL}/restaurants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Failed to create restaurant';
        throw new Error(message);
    }
    return data;
}
//# sourceMappingURL=restaurantsApi.js.map