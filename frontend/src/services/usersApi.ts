import { API_URL } from '../constants/config';
import type { Restaurant, TrainingSection, User } from '../types/auth';
import { throwIfUnauthorized } from './authSession';

export type TrainingAccessUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  isApproved: boolean;
  isOnProbation: boolean;
  trainingAccess: TrainingSection[];
  restaurantId?: number | null;
  restaurant?: Pick<Restaurant, 'id' | 'name'> | null;
};

export type UnassignedUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
};

export async function fetchTrainingAccessUsers(
  token: string,
  filters?: { restaurantId?: number },
): Promise<TrainingAccessUser[]> {
  const query =
    filters?.restaurantId && filters.restaurantId > 0
      ? `?restaurantId=${filters.restaurantId}`
      : '';

  const response = await fetch(`${API_URL}/users/training-access${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | TrainingAccessUser[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to load users';
    throw new Error(message);
  }

  return data as TrainingAccessUser[];
}

export async function updateUserTrainingAccess(
  token: string,
  userId: number,
  sections: TrainingSection[],
): Promise<TrainingAccessUser> {
  const response = await fetch(`${API_URL}/users/${userId}/training-access`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sections }),
  });

  const data = (await response.json()) as
    | TrainingAccessUser
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to update training access';
    throw new Error(message);
  }

  return data as TrainingAccessUser;
}

export async function fetchUnassignedUsers(token: string): Promise<UnassignedUser[]> {
  const response = await fetch(`${API_URL}/users/unassigned`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | UnassignedUser[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to load unassigned users';
    throw new Error(message);
  }

  return data as UnassignedUser[];
}

export async function assignUserRestaurant(
  token: string,
  userId: number,
  restaurantId: number,
) {
  const response = await fetch(`${API_URL}/users/${userId}/restaurant`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurantId }),
  });

  const data = (await response.json()) as
    | { id: number }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to assign user restaurant';
    throw new Error(message);
  }

  return data as { id: number };
}

export async function updateUserManagerRole(
  token: string,
  userId: number,
  payload: { isManager: boolean; restaurantId?: number },
): Promise<TrainingAccessUser> {
  const response = await fetch(`${API_URL}/users/${userId}/manager-role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | TrainingAccessUser
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to update manager role';
    throw new Error(message);
  }

  return data as TrainingAccessUser;
}

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: File;
};

export async function uploadMyProfilePhoto(
  token: string,
  file: PickedFile,
): Promise<User> {
  const formData = new FormData();

  if (file.file) {
    formData.append('file', file.file);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'image/jpeg',
    } as never);
  }

  const response = await fetch(`${API_URL}/users/me/profile-photo`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = (await response.json()) as User | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to upload profile photo';
    throw new Error(message);
  }

  return data as User;
}

export async function confirmUserProbation(
  token: string,
  userId: number,
): Promise<{ id: number; isOnProbation: boolean }> {
  const response = await fetch(`${API_URL}/users/${userId}/confirm-probation`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | { id?: unknown; isOnProbation?: unknown; message?: string | string[] }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to confirm probation status';
    throw new Error(message);
  }

  return {
    id:
      typeof (data as { id?: unknown }).id === 'number'
        ? ((data as { id: number }).id as number)
        : userId,
    isOnProbation:
      typeof (data as { isOnProbation?: unknown }).isOnProbation === 'boolean'
        ? ((data as { isOnProbation: boolean }).isOnProbation as boolean)
        : false,
  };
}

export async function approveUserAccount(
  token: string,
  userId: number,
): Promise<{ id: number; isApproved: boolean }> {
  const response = await fetch(`${API_URL}/users/${userId}/approve-account`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | { id?: unknown; isApproved?: unknown; message?: string | string[] }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to approve account';
    throw new Error(message);
  }

  return {
    id:
      typeof (data as { id?: unknown }).id === 'number'
        ? ((data as { id: number }).id as number)
        : userId,
    isApproved:
      typeof (data as { isApproved?: unknown }).isApproved === 'boolean'
        ? ((data as { isApproved: boolean }).isApproved as boolean)
        : true,
  };
}
