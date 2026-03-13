const DEFAULT_CORS_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
];

export function normalizeApiPrefix(value: string | undefined) {
  return (value ?? '').trim().replace(/^\/+|\/+$/g, '');
}

export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseCorsOrigins(value: string | undefined) {
  const parsed = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : [...DEFAULT_CORS_ORIGINS];
}

export function createCorsOriginValidator(allowedOrigins: string[]) {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  };
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseBooleanString(
  value: string | undefined,
  fallback = false,
) {
  if (!value?.trim()) {
    return fallback;
  }

  return value.trim().toLowerCase() === 'true';
}
