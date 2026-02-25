import { API_URL } from '../constants/config';
import type { Restaurant, TrainingSection } from '../types/auth';

export type TrainingAccessUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
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

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to assign user restaurant';
    throw new Error(message);
  }

  return data as { id: number };
}
