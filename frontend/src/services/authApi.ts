import { API_URL } from '../constants/config';
import type { AuthMode, AuthResponse, RegisterResponse } from '../types/auth';

type AuthPayload = {
  email: string;
  password: string;
  name?: string;
  restaurantId?: number;
};

export async function requestAuth(
  mode: AuthMode,
  payload: AuthPayload,
): Promise<AuthResponse | RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/${mode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | AuthResponse
    | RegisterResponse
    | { message?: string | string[] };

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message ?? 'Une erreur est survenue';
    throw new Error(message);
  }

  return data as AuthResponse | RegisterResponse;
}
