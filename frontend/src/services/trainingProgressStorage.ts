import AsyncStorage from '@react-native-async-storage/async-storage';

export type TrainingCompletionMap = Record<string, { completedAt: string }>;

function getStorageKey(userId: number) {
  return `training_progress_v2_${userId}`;
}

function readSessionStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
      return;
    }

    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore browser storage errors.
  }
}

function parseCompletionMap(raw: string | null): TrainingCompletionMap {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const output: TrainingCompletionMap = {};
    for (const [fileName, entry] of Object.entries(parsed)) {
      if (
        typeof fileName === 'string' &&
        entry &&
        typeof entry === 'object' &&
        typeof (entry as { completedAt?: unknown }).completedAt === 'string'
      ) {
        output[fileName] = {
          completedAt: (entry as { completedAt: string }).completedAt,
        };
      }
    }

    return output;
  } catch {
    return {};
  }
}

export async function loadTrainingCompletionMap(
  userId: number,
): Promise<TrainingCompletionMap> {
  const key = getStorageKey(userId);
  const asyncValue = await AsyncStorage.getItem(key);
  if (asyncValue) {
    return parseCompletionMap(asyncValue);
  }

  return parseCompletionMap(readSessionStorage(key));
}

export async function saveTrainingCompletionMap(
  userId: number,
  data: TrainingCompletionMap,
): Promise<void> {
  const key = getStorageKey(userId);
  const serialized = JSON.stringify(data);
  writeSessionStorage(key, serialized);
  await AsyncStorage.setItem(key, serialized);
}

export async function setTrainingItemCompletion(
  userId: number,
  fileName: string,
  completed: boolean,
): Promise<TrainingCompletionMap> {
  const current = await loadTrainingCompletionMap(userId);
  const next = { ...current };

  if (completed) {
    next[fileName] = { completedAt: new Date().toISOString() };
  } else {
    delete next[fileName];
  }

  await saveTrainingCompletionMap(userId, next);
  return next;
}
