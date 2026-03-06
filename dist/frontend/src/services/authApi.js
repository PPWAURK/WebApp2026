"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestAuth = requestAuth;
exports.requestForgotPassword = requestForgotPassword;
exports.requestResetPassword = requestResetPassword;
const config_1 = require("../constants/config");
async function requestAuth(mode, payload) {
    const response = await fetch(`${config_1.API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const data = (await response.json());
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Une erreur est survenue';
        throw new Error(message);
    }
    return data;
}
async function requestForgotPassword(email, language) {
    const response = await fetch(`${config_1.API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, language }),
    });
    const data = (await response.json());
    if (!response.ok) {
        const message = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ?? 'Une erreur est survenue';
        throw new Error(message);
    }
    return {
        message: Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'OK',
    };
}
async function requestResetPassword(token, password) {
    const response = await fetch(`${config_1.API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
    });
    const data = (await response.json());
    if (!response.ok) {
        const message = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ?? 'Une erreur est survenue';
        throw new Error(message);
    }
    return {
        message: Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'OK',
    };
}
//# sourceMappingURL=authApi.js.map