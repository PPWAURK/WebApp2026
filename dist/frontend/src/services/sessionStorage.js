"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStoredSession = loadStoredSession;
exports.persistSession = persistSession;
exports.clearSession = clearSession;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const storage_1 = require("../constants/storage");
function readWebSessionStorage() {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        return window.sessionStorage.getItem(storage_1.SESSION_KEY);
    }
    catch {
        return null;
    }
}
function writeWebSessionStorage(value) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        if (value === null) {
            window.sessionStorage.removeItem(storage_1.SESSION_KEY);
            return;
        }
        window.sessionStorage.setItem(storage_1.SESSION_KEY, value);
    }
    catch {
    }
}
async function loadStoredSession() {
    const rememberPreference = await async_storage_1.default.getItem(storage_1.REMEMBER_ME_KEY);
    const rememberMe = rememberPreference !== '0';
    if (!rememberMe) {
        await async_storage_1.default.removeItem(storage_1.SESSION_KEY);
        const transientSession = readWebSessionStorage();
        if (!transientSession) {
            return { session: null, rememberMe };
        }
        return {
            session: JSON.parse(transientSession),
            rememberMe,
        };
    }
    const rawSession = await async_storage_1.default.getItem(storage_1.SESSION_KEY);
    if (!rawSession) {
        return { session: null, rememberMe };
    }
    return {
        session: JSON.parse(rawSession),
        rememberMe,
    };
}
async function persistSession(session, rememberMe) {
    await async_storage_1.default.setItem(storage_1.REMEMBER_ME_KEY, rememberMe ? '1' : '0');
    if (rememberMe) {
        writeWebSessionStorage(null);
        await async_storage_1.default.setItem(storage_1.SESSION_KEY, JSON.stringify(session));
        return;
    }
    writeWebSessionStorage(JSON.stringify(session));
    await async_storage_1.default.removeItem(storage_1.SESSION_KEY);
}
async function clearSession() {
    writeWebSessionStorage(null);
    await async_storage_1.default.removeItem(storage_1.SESSION_KEY);
}
//# sourceMappingURL=sessionStorage.js.map