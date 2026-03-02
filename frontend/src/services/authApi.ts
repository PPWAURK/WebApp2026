import { API_URL } from '../constants/config';
import type { Language } from '../types/language';
import type { AuthMode, AuthResponse, RegisterResponse } from '../types/auth';

type AuthPayload = {
  email: string;
  password: string;
  name?: string;
  restaurantId?: number;
  language?: Language;
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

export async function requestForgotPassword(
  email: string,
  language: Language,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, language }),
  });

  const data = (await response.json()) as { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? 'Une erreur est survenue';
    throw new Error(message);
  }

  return {
    message: Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'OK',
  };
}

export async function requestResetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password }),
  });

  const data = (await response.json()) as { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? 'Une erreur est survenue';
    throw new Error(message);
  }

  return {
    message: Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'OK',
  };
}
