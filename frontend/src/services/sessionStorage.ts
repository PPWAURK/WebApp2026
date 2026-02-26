import AsyncStorage from '@react-native-async-storage/async-storage';
import { REMEMBER_ME_KEY, SESSION_KEY } from '../constants/storage';
import type { AuthResponse } from '../types/auth';

function readWebSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeWebSessionStorage(value: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value === null) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, value);
  } catch {
    // Ignore browser storage errors
  }
}

export async function loadStoredSession(): Promise<{
  session: AuthResponse | null;
  rememberMe: boolean;
}> {
  const rememberPreference = await AsyncStorage.getItem(REMEMBER_ME_KEY);
  const rememberMe = rememberPreference !== '0';

  if (!rememberMe) {
    await AsyncStorage.removeItem(SESSION_KEY);
    const transientSession = readWebSessionStorage();

    if (!transientSession) {
      return { session: null, rememberMe };
    }

    return {
      session: JSON.parse(transientSession) as AuthResponse,
      rememberMe,
    };
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
    writeWebSessionStorage(null);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }

  writeWebSessionStorage(JSON.stringify(session));
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function clearSession(): Promise<void> {
  writeWebSessionStorage(null);
  await AsyncStorage.removeItem(SESSION_KEY);
}
