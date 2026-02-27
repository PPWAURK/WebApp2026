import { API_URL } from '../constants/config';
import type { Restaurant } from '../types/auth';
import { throwIfUnauthorized } from './authSession';

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const response = await fetch(`${API_URL}/restaurants`);
  const data = (await response.json()) as Restaurant[] | { message?: string | string[] };

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to load restaurants';
    throw new Error(message);
  }

  return data as Restaurant[];
}

export async function createRestaurant(
  token: string,
  payload: { name: string; address: string },
): Promise<Restaurant> {
  const response = await fetch(`${API_URL}/restaurants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as Restaurant | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Failed to create restaurant';
    throw new Error(message);
  }

  return data as Restaurant;
}
