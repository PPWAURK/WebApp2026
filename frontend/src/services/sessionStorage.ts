import AsyncStorage from '@react-native-async-storage/async-storage';
import { REMEMBER_ME_KEY, SESSION_KEY } from '../constants/storage';
import type { AuthResponse } from '../types/auth';

export async function loadStoredSession(): Promise<{
  session: AuthResponse | null;
  rememberMe: boolean;
}> {
  const rememberPreference = await AsyncStorage.getItem(REMEMBER_ME_KEY);
  const rememberMe = rememberPreference !== '0';

  if (!rememberMe) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return { session: null, rememberMe };
  }

  const rawSession = await AsyncStorage.getItem(SESSION_KEY);
  if (!rawSession) {
    return { session: null, rememberMe };
  }

  return {
    session: JSON.parse(rawSession) as AuthResponse,
    rememberMe,
  };
}

export async function persistSession(
  session: AuthResponse,
  rememberMe: boolean,
): Promise<void> {
  await AsyncStorage.setItem(REMEMBER_ME_KEY, rememberMe ? '1' : '0');

  if (rememberMe) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }

  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
