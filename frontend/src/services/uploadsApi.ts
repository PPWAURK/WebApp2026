import { API_URL } from '../constants/config';

export type UploadedFileResponse = {
  fileName: string;
  category: 'images' | 'videos' | 'documents';
  originalName: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  mediaType: 'image' | 'video' | 'document';
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
): Promise<UploadedFileResponse> {
  const formData = new FormData();

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

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Upload failed';
    throw new Error(message);
  }

  return data as UploadedFileResponse;
}
