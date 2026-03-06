"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const multer_1 = require("multer");
const platform_express_1 = require("@nestjs/platform-express");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const uploads_service_1 = require("./uploads.service");
const UPLOAD_MAX_FILE_SIZE = 800 * 1024 * 1024;
const UPLOAD_MAX_FILES = 10;
const STORAGE_ROOT_PATH = process.env.STORAGE_ROOT_PATH ?? (0, path_1.join)(process.cwd(), 'uploads');
const FALLBACK_MIME_TYPES_BY_EXTENSION = {
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
const ALLOWED_DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
];
function resolveUploadMimeType(mimeType, originalName) {
    const normalizedMimeType = mimeType?.trim().toLowerCase();
    if (normalizedMimeType &&
        normalizedMimeType !== 'application/octet-stream' &&
        normalizedMimeType !== '*/*') {
        return normalizedMimeType;
    }
    const extension = (0, path_1.extname)(originalName || '').replace('.', '').toLowerCase();
    return (FALLBACK_MIME_TYPES_BY_EXTENSION[extension] ??
        normalizedMimeType ??
        'application/octet-stream');
}
function getStorageDirectoryByMimeType(mimeType) {
    if (mimeType.startsWith('image/')) {
        return (0, path_1.join)(STORAGE_ROOT_PATH, 'images');
    }
    if (mimeType.startsWith('video/')) {
        return (0, path_1.join)(STORAGE_ROOT_PATH, 'videos');
    }
    return (0, path_1.join)(STORAGE_ROOT_PATH, 'documents');
}
function ensureDirectoryExists(directoryPath) {
    if (!(0, fs_1.existsSync)(directoryPath)) {
        (0, fs_1.mkdirSync)(directoryPath, { recursive: true });
    }
}
function createStoredFileName(originalName) {
    const fileExtension = (0, path_1.extname)(originalName || '').toLowerCase();
    return `${(0, crypto_1.randomUUID)()}${fileExtension}`;
}
function isAllowedMimeType(mimeType) {
    if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        return true;
    }
    return ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType);
}
let UploadsController = class UploadsController {
    uploadsService;
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    uploadSingle(file, req, module, section) {
        const authenticatedRequest = req;
        return this.uploadsService.handleSingleUpload(file, req, {
            module,
            section,
            uploadedByUserId: authenticatedRequest.user?.id,
        });
    }
    uploadMultiple(files, req, module, section) {
        const authenticatedRequest = req;
        return this.uploadsService.handleMultipleUpload(files, req, {
            module,
            section,
            uploadedByUserId: authenticatedRequest.user?.id,
        });
    }
    listLibrary(req, module, section, mediaType) {
        const authenticatedRequest = req;
        return this.uploadsService.listLibrary(req, { module, section, mediaType }, {
            role: authenticatedRequest.user?.role,
            trainingAccess: authenticatedRequest.user?.trainingAccess,
        });
    }
    getUploadedFile(category, fileName, res) {
        const filePath = this.uploadsService.resolveFilePath(category, fileName);
        return res.sendFile(filePath);
    }
    deleteLibraryEntry(req, documentId) {
        const authenticatedRequest = req;
        if (authenticatedRequest.user?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin only');
        }
        return this.uploadsService.deleteLibraryEntry(documentId);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload a single image or video' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                module: {
                    type: 'string',
                    enum: ['TRAINING', 'POLICY', 'MANAGEMENT', 'FORMS'],
                },
                section: {
                    type: 'string',
                    enum: [
                        'RECIPE_TRAINING',
                        'RECIPE',
                        'MISE_EN_PLACE_SOP',
                        'RED_RULES',
                        'BLACK_RULES',
                        'SALLE_TOOLS',
                        'CUISINE_TOOLS',
                        'MEAT_DATE_FORM',
                        'CLEANING_FORM',
                    ],
                },
            },
            required: ['file', 'module', 'section'],
        },
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('single'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, file, callback) => {
                const resolvedMimeType = resolveUploadMimeType(file.mimetype, file.originalname);
                const destination = getStorageDirectoryByMimeType(resolvedMimeType);
                ensureDirectoryExists(destination);
                callback(null, destination);
            },
            filename: (_req, file, callback) => {
                callback(null, createStoredFileName(file.originalname));
            },
        }),
        limits: {
            fileSize: UPLOAD_MAX_FILE_SIZE,
        },
        fileFilter: (_req, file, callback) => {
            const resolvedMimeType = resolveUploadMimeType(file.mimetype, file.originalname);
            if (!isAllowedMimeType(resolvedMimeType)) {
                callback(new common_1.BadRequestException('Only image, video and document files are allowed'), false);
                return;
            }
            file.mimetype = resolvedMimeType;
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)('module')),
    __param(3, (0, common_1.Body)('section')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadSingle", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload multiple image/video files (max 10)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
                module: {
                    type: 'string',
                    enum: ['TRAINING', 'POLICY', 'MANAGEMENT', 'FORMS'],
                },
                section: {
                    type: 'string',
                    enum: [
                        'RECIPE_TRAINING',
                        'RECIPE',
                        'MISE_EN_PLACE_SOP',
                        'RED_RULES',
                        'BLACK_RULES',
                        'SALLE_TOOLS',
                        'CUISINE_TOOLS',
                        'MEAT_DATE_FORM',
                        'CLEANING_FORM',
                    ],
                },
            },
            required: ['files', 'module', 'section'],
        },
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('multiple'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', UPLOAD_MAX_FILES, {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, file, callback) => {
                const resolvedMimeType = resolveUploadMimeType(file.mimetype, file.originalname);
                const destination = getStorageDirectoryByMimeType(resolvedMimeType);
                ensureDirectoryExists(destination);
                callback(null, destination);
            },
            filename: (_req, file, callback) => {
                callback(null, createStoredFileName(file.originalname));
            },
        }),
        limits: {
            fileSize: UPLOAD_MAX_FILE_SIZE,
        },
        fileFilter: (_req, file, callback) => {
            const resolvedMimeType = resolveUploadMimeType(file.mimetype, file.originalname);
            if (!isAllowedMimeType(resolvedMimeType)) {
                callback(new common_1.BadRequestException('Only image, video and document files are allowed'), false);
                return;
            }
            file.mimetype = resolvedMimeType;
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)('module')),
    __param(3, (0, common_1.Body)('section')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadMultiple", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List uploaded files with business classification' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('library'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('module')),
    __param(2, (0, common_1.Query)('section')),
    __param(3, (0, common_1.Query)('mediaType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "listLibrary", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get uploaded file by category and file name' }),
    (0, common_1.Get)(':category/:fileName'),
    __param(0, (0, common_1.Param)('category')),
    __param(1, (0, common_1.Param)('fileName')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "getUploadedFile", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete one library media file (admin only)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('library/:documentId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('documentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "deleteLibraryEntry", null);
exports.UploadsController = UploadsController = __decorate([
    (0, swagger_1.ApiTags)('uploads'),
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map