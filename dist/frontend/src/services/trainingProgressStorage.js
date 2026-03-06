"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTrainingCompletionMap = loadTrainingCompletionMap;
exports.saveTrainingCompletionMap = saveTrainingCompletionMap;
exports.setTrainingItemCompletion = setTrainingItemCompletion;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
function getStorageKey(userId) {
    return `training_progress_v2_${userId}`;
}
function readSessionStorage(key) {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        return window.sessionStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function writeSessionStorage(key, value) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        if (value === null) {
            window.sessionStorage.removeItem(key);
            return;
        }
        window.sessionStorage.setItem(key, value);
    }
    catch {
    }
}
function parseCompletionMap(raw) {
    if (!raw) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return {};
        }
        const output = {};
        for (const [fileName, entry] of Object.entries(parsed)) {
            if (typeof fileName === 'string' &&
                entry &&
                typeof entry === 'object' &&
                typeof entry.completedAt === 'string') {
                output[fileName] = {
                    completedAt: entry.completedAt,
                };
            }
        }
        return output;
    }
    catch {
        return {};
    }
}
async function loadTrainingCompletionMap(userId) {
    const key = getStorageKey(userId);
    const asyncValue = await async_storage_1.default.getItem(key);
    if (asyncValue) {
        return parseCompletionMap(asyncValue);
    }
    return parseCompletionMap(readSessionStorage(key));
}
async function saveTrainingCompletionMap(userId, data) {
    const key = getStorageKey(userId);
    const serialized = JSON.stringify(data);
    writeSessionStorage(key, serialized);
    await async_storage_1.default.setItem(key, serialized);
}
async function setTrainingItemCompletion(userId, fileName, completed) {
    const current = await loadTrainingCompletionMap(userId);
    const next = { ...current };
    if (completed) {
        next[fileName] = { completedAt: new Date().toISOString() };
    }
    else {
        delete next[fileName];
    }
    await saveTrainingCompletionMap(userId, next);
    return next;
}
//# sourceMappingURL=trainingProgressStorage.js.map