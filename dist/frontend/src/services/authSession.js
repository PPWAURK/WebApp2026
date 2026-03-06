"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUnauthorized = onUnauthorized;
exports.notifyUnauthorized = notifyUnauthorized;
exports.throwIfUnauthorized = throwIfUnauthorized;
const unauthorizedListeners = new Set();
function onUnauthorized(listener) {
    unauthorizedListeners.add(listener);
    return () => {
        unauthorizedListeners.delete(listener);
    };
}
function notifyUnauthorized() {
    unauthorizedListeners.forEach((listener) => {
        listener();
    });
}
function throwIfUnauthorized(response) {
    if (response.status === 401) {
        notifyUnauthorized();
        throw new Error('AUTH_SESSION_EXPIRED');
    }
}
//# sourceMappingURL=authSession.js.map