import { PrismaService } from '../prisma/prisma.service';
type RequestLike = {
    protocol: string;
    get: (name: string) => string | undefined;
};
export declare class NewsService {
    private readonly prisma;
    private readonly publicApiBaseUrl;
    constructor(prisma: PrismaService);
    createNewsPost(req: RequestLike, input: {
        title: string;
        message: string;
        audience?: string;
        module?: string;
        section?: string;
        attachmentDocumentId?: number;
        createdByUserId: number;
    }): Promise<{
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
    listNewsPosts(req: RequestLike, context: {
        userId: number;
        role: string;
        trainingAccess?: string[];
        limit?: number;
        month?: string;
    }): Promise<{
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
    deleteNewsPost(newsPostId: number): Promise<{
        success: boolean;
    }>;
    markNewsAsRead(newsPostId: number, userId: number, context: {
        role: string;
        trainingAccess?: string[];
    }): Promise<{
        success: boolean;
    }>;
    getNewsReadTracking(newsPostId: number): Promise<{
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
    private parseAudience;
    private getAudienceRoles;
    private ensureCanReadPost;
    private filterUsersBySectionAccess;
    private parseUploadModule;
    private parseUploadSection;
    private parseMonthRange;
    private buildFileUrl;
}
export {};
