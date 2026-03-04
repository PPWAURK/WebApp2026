import type { Request } from 'express';
import { NewsService } from './news.service';
type AuthenticatedRequest = Request & {
    user?: {
        id?: number;
        role?: string;
        trainingAccess?: string[];
    };
};
export declare class NewsController {
    private readonly newsService;
    constructor(newsService: NewsService);
    createNewsPost(req: AuthenticatedRequest, title: string | undefined, message: string | undefined, audience: string | undefined, module: string | undefined, section: string | undefined, attachmentDocumentIdRaw: number | undefined): Promise<{
        id: number;
        title: string;
        message: string;
        audience: import("@prisma/client").$Enums.NewsAudience;
        module: import("@prisma/client").$Enums.UploadModule | null;
        section: import("@prisma/client").$Enums.UploadSection | null;
        createdAt: Date;
        isRead: boolean;
        createdBy: {
            id: number;
            email: string;
            name: string | null;
        };
        attachment: {
            documentId: number;
            originalName: string;
            mimeType: string;
            mediaType: import("@prisma/client").$Enums.UploadMediaType;
            fileUrl: string;
        } | null;
    }>;
    listNewsPosts(req: AuthenticatedRequest, limitRaw: string | undefined, month: string | undefined): Promise<{
        items: {
            id: number;
            title: string;
            message: string;
            audience: import("@prisma/client").$Enums.NewsAudience;
            module: import("@prisma/client").$Enums.UploadModule | null;
            section: import("@prisma/client").$Enums.UploadSection | null;
            createdAt: Date;
            isRead: boolean;
            createdBy: {
                id: number;
                email: string;
                name: string | null;
            };
            attachment: {
                documentId: number;
                originalName: string;
                mimeType: string;
                mediaType: import("@prisma/client").$Enums.UploadMediaType;
                fileUrl: string;
            } | null;
        }[];
        availableMonths: string[];
    }>;
    deleteNewsPost(req: AuthenticatedRequest, newsId: number): Promise<{
        success: boolean;
    }>;
    markNewsAsRead(req: AuthenticatedRequest, newsId: number): Promise<{
        success: boolean;
    }>;
    getNewsReadTracking(req: AuthenticatedRequest, newsId: number): Promise<{
        newsPostId: number;
        totalUsers: number;
        readCount: number;
        unreadCount: number;
        byRestaurant: {
            restaurant: {
                id: number;
                name: string;
                address: string;
            } | null;
            totalUsers: number;
            readCount: number;
            unreadCount: number;
            unreadUsers: {
                id: number;
                name: string | null;
                email: string;
                role: string;
            }[];
            readUsers: {
                id: number;
                name: string | null;
                email: string;
                role: string;
                readAt: Date | null;
            }[];
        }[];
    }>;
}
export {};
