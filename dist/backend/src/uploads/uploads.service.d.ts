import { PrismaService } from '../prisma/prisma.service';
export declare class UploadsService {
    private readonly prisma;
    private readonly fallbackMimeTypesByExtension;
    private readonly storageRoot;
    private readonly publicApiBaseUrl;
    private readonly storageDirs;
    constructor(prisma: PrismaService);
    handleSingleUpload(file: Express.Multer.File, req: {
        protocol: string;
        get: (name: string) => string | undefined;
    }, metadataInput: {
        module?: string;
        section?: string;
        uploadedByUserId?: number;
    }): Promise<{
        documentId: number;
        fileName: string;
        category: import("@prisma/client").$Enums.UploadCategory;
        originalName: string;
        mimeType: string;
        size: number;
        fileUrl: string;
        mediaType: import("@prisma/client").$Enums.UploadMediaType;
        module: import("@prisma/client").$Enums.UploadModule;
        section: import("@prisma/client").$Enums.UploadSection;
    }>;
    handleMultipleUpload(files: Express.Multer.File[], req: {
        protocol: string;
        get: (name: string) => string | undefined;
    }, metadataInput: {
        module?: string;
        section?: string;
        uploadedByUserId?: number;
    }): Promise<{
        documentId: number;
        fileName: string;
        category: import("@prisma/client").$Enums.UploadCategory;
        originalName: string;
        mimeType: string;
        size: number;
        fileUrl: string;
        mediaType: import("@prisma/client").$Enums.UploadMediaType;
        module: import("@prisma/client").$Enums.UploadModule;
        section: import("@prisma/client").$Enums.UploadSection;
    }[]>;
    listLibrary(req: {
        protocol: string;
        get: (name: string) => string | undefined;
    }, filters: {
        module?: string;
        section?: string;
        mediaType?: string;
    }, authContext: {
        role?: string;
        trainingAccess?: string[] | undefined;
    }): Promise<{
        fileUrl: string;
        id: number;
        section: import("@prisma/client").$Enums.UploadSection;
        fileName: string;
        category: import("@prisma/client").$Enums.UploadCategory;
        originalName: string;
        mimeType: string;
        size: number;
        mediaType: import("@prisma/client").$Enums.UploadMediaType;
        module: import("@prisma/client").$Enums.UploadModule;
        uploadedAt: Date;
        uploadedByUserId: number | null;
        documentId: number;
    }[]>;
    resolveFilePath(category: string, fileName: string): string;
    deleteLibraryEntry(documentId: number): Promise<{
        success: boolean;
    }>;
    private buildFileUrl;
    private parseCategory;
    private parseUploadModule;
    private parseUploadSection;
    private parseMediaType;
    private getCategoryFromMimeType;
    private getMediaType;
    private ensureStorageFolders;
    private resolveStorageRoot;
    private normalizeOriginalName;
    private resolveMimeType;
}
