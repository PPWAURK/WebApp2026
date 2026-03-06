"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNewsFeed = fetchNewsFeed;
exports.createNewsPost = createNewsPost;
exports.markNewsAsRead = markNewsAsRead;
exports.deleteNewsPost = deleteNewsPost;
exports.fetchNewsReadTracking = fetchNewsReadTracking;
const config_1 = require("../constants/config");
const authSession_1 = require("./authSession");
async function fetchNewsFeed(token, options) {
    const params = new URLSearchParams();
    if (options?.limit) {
        params.set('limit', `${options.limit}`);
    }
    if (options?.month) {
        params.set('month', options.month);
    }
    const query = params.toString();
    const endpoint = query ? `${config_1.API_URL}/news?${query}` : `${config_1.API_URL}/news`;
    const response = await fetch(endpoint, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Failed to load news feed';
        throw new Error(message);
    }
    return data;
}
async function createNewsPost(token, payload) {
    const response = await fetch(`${config_1.API_URL}/news`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Failed to create news post';
        throw new Error(message);
    }
    return data;
}
async function markNewsAsRead(token, newsId) {
    const response = await fetch(`${config_1.API_URL}/news/${newsId}/read`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const message = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ?? 'Failed to mark news as read';
        throw new Error(message);
    }
}
async function deleteNewsPost(token, newsId) {
    const response = await fetch(`${config_1.API_URL}/news/${newsId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const message = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ?? 'Failed to delete news post';
        throw new Error(message);
    }
}
async function fetchNewsReadTracking(token, newsId) {
    const response = await fetch(`${config_1.API_URL}/news/${newsId}/read-tracking`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Failed to fetch news read tracking';
        throw new Error(message);
    }
    return data;
}
//# sourceMappingURL=newsApi.js.map