import type { LibraryModule, LibrarySection } from '../constants/documentTaxonomy';
export type NewsAudience = 'ALL' | 'MANAGERS' | 'EMPLOYEES';
export type NewsPostItem = {
    id: number;
    title: string;
    message: string;
    audience: NewsAudience;
    module: LibraryModule | null;
    section: LibrarySection | null;
    createdAt: string;
    isRead: boolean;
    createdBy: {
        id: number;
        name: string | null;
        email: string;
    };
    attachment: {
        documentId: number;
        originalName: string;
        mimeType: string;
        mediaType: 'image' | 'video' | 'document';
        fileUrl: string;
    } | null;
};
export type NewsFeedResponse = {
    items: NewsPostItem[];
    availableMonths: string[];
};
export type NewsReadTrackingUser = {
    id: number;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'EMPLOYEE';
};
export type NewsReadTrackingReadUser = NewsReadTrackingUser & {
    readAt: string;
};
export type NewsReadTrackingRestaurantGroup = {
    restaurant: {
        id: number;
        name: string;
        address: string;
    } | null;
    totalUsers: number;
    readCount: number;
    unreadCount: number;
    unreadUsers: NewsReadTrackingUser[];
    readUsers: NewsReadTrackingReadUser[];
};
export type NewsReadTrackingResponse = {
    newsPostId: number;
    totalUsers: number;
    readCount: number;
    unreadCount: number;
    byRestaurant: NewsReadTrackingRestaurantGroup[];
};
export declare function fetchNewsFeed(token: string, options?: {
    limit?: number;
    month?: string;
}): Promise<NewsFeedResponse>;
export declare function createNewsPost(token: string, payload: {
    title: string;
    message: string;
    audience: NewsAudience;
    module?: LibraryModule;
    section?: LibrarySection;
    attachmentDocumentId?: number;
}): Promise<NewsPostItem>;
export declare function markNewsAsRead(token: string, newsId: number): Promise<void>;
export declare function deleteNewsPost(token: string, newsId: number): Promise<void>;
export declare function fetchNewsReadTracking(token: string, newsId: number): Promise<NewsReadTrackingResponse>;
