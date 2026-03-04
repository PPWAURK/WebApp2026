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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_taxonomy_1 = require("./upload-taxonomy");
let UploadsService = class UploadsService {
    prisma;
    storageRoot = this.resolveStorageRoot(process.env.STORAGE_ROOT_PATH);
    publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
    storageDirs = {
        [client_1.UploadCategory.images]: (0, path_1.join)(this.storageRoot, 'images'),
        [client_1.UploadCategory.videos]: (0, path_1.join)(this.storageRoot, 'videos'),
        [client_1.UploadCategory.documents]: (0, path_1.join)(this.storageRoot, 'documents'),
    };
    constructor(prisma) {
        this.prisma = prisma;
        this.ensureStorageFolders();
    }
    async handleSingleUpload(file, req, metadataInput) {
        if (!file) {
            throw new common_1.BadRequestException('A file is required');
        }
        const module = this.parseUploadModule(metadataInput.module);
        const section = this.parseUploadSection(metadataInput.section);
        if (!(0, upload_taxonomy_1.isSectionInModule)(module, section)) {
            throw new common_1.BadRequestException('Section does not belong to selected module');
        }
        const category = this.getCategoryFromMimeType(file.mimetype);
        const mediaType = this.getMediaType(file.mimetype);
        const normalizedOriginalName = this.normalizeOriginalName(file.originalname);
        const createdDocument = await this.prisma.document.create({
            data: {
                fileName: file.filename,
                category,
                originalName: normalizedOriginalName,
                mimeType: file.mimetype,
                size: file.size,
                mediaType,
                module,
                section,
                uploadedByUserId: metadataInput.uploadedByUserId ?? null,
            },
        });
        return {
            documentId: createdDocument.id,
            fileName: createdDocument.fileName,
            category: createdDocument.category,
            originalName: createdDocument.originalName,
            mimeType: createdDocument.mimeType,
            size: createdDocument.size,
            fileUrl: this.buildFileUrl(req, createdDocument.category, createdDocument.fileName),
            mediaType: createdDocument.mediaType,
            module: createdDocument.module,
            section: createdDocument.section,
        };
    }
    async handleMultipleUpload(files, req, metadataInput) {
        if (!files?.length) {
            throw new common_1.BadRequestException('At least one file is required');
        }
        return Promise.all(files.map((file) => this.handleSingleUpload(file, req, metadataInput)));
    }
    async listLibrary(req, filters, authContext) {
        const moduleFilter = filters.module
            ? this.parseUploadModule(filters.module)
            : undefined;
        const sectionFilter = filters.section
            ? this.parseUploadSection(filters.section)
            : undefined;
        const mediaTypeFilter = filters.mediaType
            ? this.parseMediaType(filters.mediaType)
            : undefined;
        const where = {
            ...(moduleFilter ? { module: moduleFilter } : {}),
            ...(sectionFilter ? { section: sectionFilter } : {}),
            ...(mediaTypeFilter ? { mediaType: mediaTypeFilter } : {}),
        };
        if (authContext.role !== 'ADMIN') {
            const allowedSections = (authContext.trainingAccess ?? []).filter((section) => (0, upload_taxonomy_1.isUploadSection)(section));
            if (!allowedSections.length) {
                return [];
            }
            where.section = {
                in: allowedSections,
            };
        }
        const entries = await this.prisma.document.findMany({
            where,
            orderBy: {
                uploadedAt: 'desc',
            },
        });
        return entries
            .map((entry) => ({
            documentId: entry.id,
            ...entry,
            fileUrl: this.buildFileUrl(req, entry.category, entry.fileName),
        }));
    }
    resolveFilePath(category, fileName) {
        const safeCategory = this.parseCategory(category);
        const safeFileName = (0, path_1.basename)(fileName);
        const fullPath = (0, path_1.join)(this.storageDirs[safeCategory], safeFileName);
        if (!(0, fs_1.existsSync)(fullPath)) {
            throw new common_1.NotFoundException('File not found');
        }
        return fullPath;
    }
    async deleteLibraryEntry(documentId) {
        const existing = await this.prisma.document.findUnique({
            where: {
                id: documentId,
            },
            select: {
                id: true,
                fileName: true,
                category: true,
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Media not found');
        }
        await this.prisma.document.delete({
            where: {
                id: documentId,
            },
        });
        const filePath = (0, path_1.join)(this.storageDirs[existing.category], (0, path_1.basename)(existing.fileName));
        if ((0, fs_1.existsSync)(filePath)) {
            (0, fs_1.unlinkSync)(filePath);
        }
        return {
            success: true,
        };
    }
    buildFileUrl(req, category, fileName) {
        if (this.publicApiBaseUrl) {
            const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
            return `${normalizedBaseUrl}/uploads/${category}/${fileName}`;
        }
        const host = req.get('host');
        return `${req.protocol}://${host}/uploads/${category}/${fileName}`;
    }
    parseCategory(category) {
        if (category === client_1.UploadCategory.images ||
            category === client_1.UploadCategory.videos ||
            category === client_1.UploadCategory.documents) {
            return category;
        }
        throw new common_1.NotFoundException('Category not found');
    }
    parseUploadModule(module) {
        if (!module || !(0, upload_taxonomy_1.isUploadModule)(module)) {
            throw new common_1.BadRequestException('Invalid module');
        }
        return module;
    }
    parseUploadSection(section) {
        if (!section || !(0, upload_taxonomy_1.isUploadSection)(section)) {
            throw new common_1.BadRequestException('Invalid section');
        }
        return section;
    }
    parseMediaType(mediaType) {
        if (mediaType === client_1.UploadMediaType.image ||
            mediaType === client_1.UploadMediaType.video ||
            mediaType === client_1.UploadMediaType.document) {
            return mediaType;
        }
        throw new common_1.BadRequestException('Invalid mediaType');
    }
    getCategoryFromMimeType(mimeType) {
        if (mimeType.startsWith('image/')) {
            return client_1.UploadCategory.images;
        }
        if (mimeType.startsWith('video/')) {
            return client_1.UploadCategory.videos;
        }
        return client_1.UploadCategory.documents;
    }
    getMediaType(mimeType) {
        if (mimeType.startsWith('image/')) {
            return client_1.UploadMediaType.image;
        }
        if (mimeType.startsWith('video/')) {
            return client_1.UploadMediaType.video;
        }
        return client_1.UploadMediaType.document;
    }
    ensureStorageFolders() {
        const folders = Object.values(this.storageDirs);
        for (const folder of folders) {
            if (!(0, fs_1.existsSync)(folder)) {
                (0, fs_1.mkdirSync)(folder, { recursive: true });
            }
        }
    }
    resolveStorageRoot(storageRootPath) {
        if (!storageRootPath) {
            return (0, path_1.join)(process.cwd(), 'uploads');
        }
        return (0, path_1.isAbsolute)(storageRootPath)
            ? storageRootPath
            : (0, path_1.resolve)(process.cwd(), storageRootPath);
    }
    normalizeOriginalName(originalName) {
        if (/[\u3400-\u9FFF]/.test(originalName)) {
            return originalName;
        }
        const decodedName = Buffer.from(originalName, 'latin1').toString('utf8');
        if (/[\u3400-\u9FFF]/.test(decodedName)) {
            return decodedName;
        }
        return originalName;
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map