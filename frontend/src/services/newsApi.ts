import type { LibraryModule, LibrarySection } from '../constants/documentTaxonomy';
import { API_URL } from '../constants/config';
import { throwIfUnauthorized } from './authSession';

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

export async function fetchNewsFeed(
  token: string,
  options?: {
    limit?: number;
    month?: string;
  },
): Promise<NewsFeedResponse> {
  const params = new URLSearchParams();
  if (options?.limit) {
    params.set('limit', `${options.limit}`);
  }
  if (options?.month) {
    params.set('month', options.month);
  }

  const query = params.toString();
  const endpoint = query ? `${API_URL}/news?${query}` : `${API_URL}/news`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as NewsFeedResponse | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to load news feed';
    throw new Error(message);
  }

  return data as NewsFeedResponse;
}

export async function createNewsPost(
  token: string,
  payload: {
    title: string;
    message: string;
    audience: NewsAudience;
    module?: LibraryModule;
    section?: LibrarySection;
    attachmentDocumentId?: number;
  },
): Promise<NewsPostItem> {
  const response = await fetch(`${API_URL}/news`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as NewsPostItem | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to create news post';
    throw new Error(message);
  }

  return data as NewsPostItem;
}

export async function markNewsAsRead(token: string, newsId: number): Promise<void> {
  const response = await fetch(`${API_URL}/news/${newsId}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as { success?: boolean; message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? 'Failed to mark news as read';
    throw new Error(message);
  }
}

export async function deleteNewsPost(token: string, newsId: number): Promise<void> {
  const response = await fetch(`${API_URL}/news/${newsId}`, {
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
      : data.message ?? 'Failed to delete news post';
    throw new Error(message);
  }
}

export async function fetchNewsReadTracking(
  token: string,
  newsId: number,
): Promise<NewsReadTrackingResponse> {
  const response = await fetch(`${API_URL}/news/${newsId}/read-tracking`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as NewsReadTrackingResponse | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to fetch news read tracking';
    throw new Error(message);
  }

  return data as NewsReadTrackingResponse;
}
