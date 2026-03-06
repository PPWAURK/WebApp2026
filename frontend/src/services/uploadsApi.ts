import { API_URL } from '../constants/config';
import type { LibraryModule, LibrarySection } from '../constants/documentTaxonomy';
import { throwIfUnauthorized } from './authSession';

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

export type ModuleCategoryItem = {
  id: number;
  module: LibraryModule;
  name: string;
  section: LibrarySection;
  createdAt: string;
  updatedAt: string;
};

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: File;
};

const EXTENSION_TO_MIME: Record<string, string> = {
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

function resolveMimeType(file: PickedFile): string {
  const currentMimeType = file.mimeType?.trim().toLowerCase();
  if (
    currentMimeType &&
    currentMimeType !== 'application/octet-stream' &&
    currentMimeType !== '*/*'
  ) {
    return currentMimeType;
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TO_MIME[extension] ?? currentMimeType ?? 'application/octet-stream';
}

export async function uploadSingleFile(
  token: string,
  file: PickedFile,
  classification: {
    module: LibraryModule;
    section: LibrarySection;
    customCategory?: string | null;
  },
): Promise<UploadedFileResponse> {
  const formData = new FormData();
  formData.append('module', classification.module);
  formData.append('section', classification.section);
  if (classification.customCategory && classification.customCategory.trim()) {
    formData.append('customCategory', classification.customCategory.trim());
  }
  const resolvedMimeType = resolveMimeType(file);

  if (file.file) {
    const normalizedWebFile =
      file.file.type && file.file.type === resolvedMimeType
        ? file.file
        : new File([file.file], file.file.name || file.name, {
            type: resolvedMimeType,
          });
    formData.append('file', normalizedWebFile);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: resolvedMimeType,
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
    customCategory?: string;
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

  if (filters.customCategory) {
    const normalizedCustomCategory = filters.customCategory.trim();
    if (normalizedCustomCategory) {
      params.set('customCategory', normalizedCustomCategory);
    }
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

export async function deleteLibraryFile(
  token: string,
  documentId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/uploads/library/${documentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as { success?: boolean; message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? 'Failed to delete media file';
    throw new Error(message);
  }
}

export async function clearLibraryCustomCategory(
  token: string,
  payload: {
    module: LibraryModule;
    section: LibrarySection;
    customCategory: string;
  },
): Promise<{ success: boolean; clearedCount: number }> {
  const response = await fetch(`${API_URL}/uploads/library/custom-category/clear`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      module: payload.module,
      section: payload.section,
      customCategory: payload.customCategory.trim(),
    }),
  });

  const data = (await response.json()) as
    | { success: boolean; clearedCount: number }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to clear custom category';
    throw new Error(message);
  }

  return data as { success: boolean; clearedCount: number };
}

export async function fetchModuleCategories(
  token: string,
  module: LibraryModule,
): Promise<ModuleCategoryItem[]> {
  const params = new URLSearchParams({ module });
  const response = await fetch(`${API_URL}/uploads/module-categories?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | ModuleCategoryItem[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to load categories';
    throw new Error(message);
  }

  return data as ModuleCategoryItem[];
}

export async function createModuleCategory(
  token: string,
  payload: {
    module: LibraryModule;
    name: string;
    section: LibrarySection;
  },
): Promise<ModuleCategoryItem> {
  const response = await fetch(`${API_URL}/uploads/module-categories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      module: payload.module,
      name: payload.name.trim(),
      section: payload.section,
    }),
  });

  const data = (await response.json()) as
    | ModuleCategoryItem
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to create category';
    throw new Error(message);
  }

  return data as ModuleCategoryItem;
}

export async function deleteModuleCategory(
  token: string,
  categoryId: number,
): Promise<{ success: boolean; clearedCount: number }> {
  const response = await fetch(`${API_URL}/uploads/module-categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | { success: boolean; clearedCount: number }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to delete category';
    throw new Error(message);
  }

  return data as { success: boolean; clearedCount: number };
}
