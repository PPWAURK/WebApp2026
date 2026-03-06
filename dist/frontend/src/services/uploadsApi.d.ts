import type { LibraryModule, LibrarySection } from '../constants/documentTaxonomy';
export type UploadedFileResponse = {
    documentId: number;
    fileName: string;
    category: 'images' | 'videos' | 'documents';
    originalName: string;
    customCategory: string | null;
    mimeType: string;
    size: number;
    fileUrl: string;
    mediaType: 'image' | 'video' | 'document';
    module: LibraryModule;
    section: LibrarySection;
};
export type LibraryFileItem = UploadedFileResponse & {
    uploadedAt: string;
    uploadedByUserId: number | null;
};
type PickedFile = {
    uri: string;
    name: string;
    mimeType?: string;
    file?: File;
};
export declare function uploadSingleFile(token: string, file: PickedFile, classification: {
    module: LibraryModule;
    section: LibrarySection;
    customCategory?: string | null;
}): Promise<UploadedFileResponse>;
export declare function fetchLibraryFiles(token: string, filters: {
    module?: LibraryModule;
    section?: LibrarySection;
    mediaType?: 'image' | 'video' | 'document';
    customCategory?: string;
}): Promise<LibraryFileItem[]>;
export declare function deleteLibraryFile(token: string, documentId: number): Promise<void>;
export {};
