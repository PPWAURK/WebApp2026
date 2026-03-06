"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleFile = uploadSingleFile;
exports.fetchLibraryFiles = fetchLibraryFiles;
exports.deleteLibraryFile = deleteLibraryFile;
const config_1 = require("../constants/config");
const authSession_1 = require("./authSession");
const EXTENSION_TO_MIME = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
};
function resolveMimeType(file) {
    const currentMimeType = file.mimeType?.trim().toLowerCase();
    if (currentMimeType &&
        currentMimeType !== 'application/octet-stream' &&
        currentMimeType !== '*/*') {
        return currentMimeType;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return EXTENSION_TO_MIME[extension] ?? currentMimeType ?? 'application/octet-stream';
}
async function uploadSingleFile(token, file, classification) {
    const formData = new FormData();
    formData.append('module', classification.module);
    formData.append('section', classification.section);
    if (classification.customCategory && classification.customCategory.trim()) {
        formData.append('customCategory', classification.customCategory.trim());
    }
    const resolvedMimeType = resolveMimeType(file);
    if (file.file) {
        const normalizedWebFile = file.file.type && file.file.type === resolvedMimeType
            ? file.file
            : new File([file.file], file.file.name || file.name, {
                type: resolvedMimeType,
            });
        formData.append('file', normalizedWebFile);
    }
    else {
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: resolvedMimeType,
        });
    }
    const response = await fetch(`${config_1.API_URL}/uploads/single`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message ?? 'Upload failed';
        throw new Error(message);
    }
    return data;
}
async function fetchLibraryFiles(token, filters) {
    const params = new URLSearchParams();
    if (filters.module) {
        params.set('module', filters.module);
    }
    if (filters.section) {
        params.set('section', filters.section);
    }
    if (filters.mediaType) {
        params.set('mediaType', filters.mediaType);
    }
    if (filters.customCategory) {
        const normalizedCustomCategory = filters.customCategory.trim();
        if (normalizedCustomCategory) {
            params.set('customCategory', normalizedCustomCategory);
        }
    }
    const queryString = params.toString();
    const endpoint = queryString
        ? `${config_1.API_URL}/uploads/library?${queryString}`
        : `${config_1.API_URL}/uploads/library`;
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
            : errorData.message ?? 'Failed to load library files';
        throw new Error(message);
    }
    return data;
}
async function deleteLibraryFile(token, documentId) {
    const response = await fetch(`${config_1.API_URL}/uploads/library/${documentId}`, {
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
            : data.message ?? 'Failed to delete media file';
        throw new Error(message);
    }
}
//# sourceMappingURL=uploadsApi.js.map