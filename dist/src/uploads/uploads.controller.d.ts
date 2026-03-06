import type { Request, Response } from 'express';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadSingle(file: Express.Multer.File, req: Request, module: string | undefined, section: string | undefined, customCategory: string | undefined): Promise<{
        documentId: number;
        fileName: string;
        category: import("@prisma/client").$Enums.UploadCategory;
        originalName: string;
        customCategory: any;
        mimeType: string;
        size: number;
        fileUrl: string;
        mediaType: import("@prisma/client").$Enums.UploadMediaType;
        module: import("@prisma/client").$Enums.UploadModule;
        section: import("@prisma/client").$Enums.UploadSection;
    }>;
    uploadMultiple(files: Express.Multer.File[], req: Request, module: string | undefined, section: string | undefined, customCategory: string | undefined): Promise<{
        documentId: number;
        fileName: string;
        category: import("@prisma/client").$Enums.UploadCategory;
        originalName: string;
        customCategory: any;
        mimeType: string;
        size: number;
        fileUrl: string;
        mediaType: import("@prisma/client").$Enums.UploadMediaType;
        module: import("@prisma/client").$Enums.UploadModule;
        section: import("@prisma/client").$Enums.UploadSection;
    }[]>;
    listLibrary(req: Request, module: string | undefined, section: string | undefined, mediaType: string | undefined, customCategory: string | undefined): Promise<{
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
    getUploadedFile(category: string, fileName: string, res: Response): void;
    deleteLibraryEntry(req: Request, documentId: number): Promise<{
        success: boolean;
    }>;
}
