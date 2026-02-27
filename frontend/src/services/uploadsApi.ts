import { API_URL } from '../constants/config';
import type { LibraryModule, LibrarySection } from '../constants/documentTaxonomy';
import { throwIfUnauthorized } from './authSession';

export type UploadedFileResponse = {
  fileName: string;
  category: 'images' | 'videos' | 'documents';
  originalName: string;
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

export async function uploadSingleFile(
  token: string,
  file: PickedFile,
  classification: {
    module: LibraryModule;
    section: LibrarySection;
  },
): Promise<UploadedFileResponse> {
  const formData = new FormData();
  formData.append('module', classification.module);
  formData.append('section', classification.section);

  if (file.file) {
    formData.append('file', file.file);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/octet-stream',
    } as never);
  }

  const response = await fetch(`${API_URL}/uploads/single`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = (await response.json()) as
    | UploadedFileResponse
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Upload failed';
    throw new Error(message);
  }

  return data as UploadedFileResponse;
}

export async function fetchLibraryFiles(
  token: string,
  filters: {
    module?: LibraryModule;
    section?: LibrarySection;
    mediaType?: 'image' | 'video' | 'document';
  },
): Promise<LibraryFileItem[]> {
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

  const queryString = params.toString();
  const endpoint = queryString
    ? `${API_URL}/uploads/library?${queryString}`
    : `${API_URL}/uploads/library`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | LibraryFileItem[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to load library files';
    throw new Error(message);
  }

  return data as LibraryFileItem[];
}
