import { API_URL } from '../constants/config';
import type { TrainingSection } from '../types/auth';

export type TrainingAccessUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  trainingAccess: TrainingSection[];
};

export async function fetchTrainingAccessUsers(
  token: string,
): Promise<TrainingAccessUser[]> {
  const response = await fetch(`${API_URL}/users/training-access`, {
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
