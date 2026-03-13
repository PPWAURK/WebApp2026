import {
  isHttpUrl,
  normalizeApiPrefix,
  parseBooleanString,
  parseCorsOrigins,
  parsePositiveInt,
} from './env.utils';

type RawEnv = Record<string, unknown>;

const DEFAULTS = {
  nodeEnv: 'development',
  port: 3000,
  jwtExpiresIn: '15m',
  storageRootPath: 'uploads',
  appWebUrl: 'http://localhost:8081',
  mailPort: 587,
  healthcheckDatabaseTimeoutMs: 1500,
};

function readString(config: RawEnv, key: string) {
  const value = config[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function validateEnvironment(config: RawEnv) {
  const errors: string[] = [];

  const nodeEnv = readString(config, 'NODE_ENV') || DEFAULTS.nodeEnv;
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be one of development, test, production');
  }

  const port = parsePositiveInt(readString(config, 'PORT'), DEFAULTS.port);
  const apiPrefix = normalizeApiPrefix(readString(config, 'API_PREFIX'));
  const databaseUrl =
    readString(config, 'DATABASE_URL') ||
    'mysql://db_user:db_password@127.0.0.1:3307/webapp2026';
  const jwtSecret =
    readString(config, 'JWT_SECRET') || 'change-me-in-production';
  const jwtExpiresIn =
    readString(config, 'JWT_EXPIRES_IN') || DEFAULTS.jwtExpiresIn;
  const corsOrigins = parseCorsOrigins(readString(config, 'CORS_ORIGIN'));
  const storageRootPath =
    readString(config, 'STORAGE_ROOT_PATH') || DEFAULTS.storageRootPath;
  const publicApiBaseUrl = readString(config, 'PUBLIC_API_BASE_URL');
  const appWebUrl = readString(config, 'APP_WEB_URL') || DEFAULTS.appWebUrl;
  const mailPort = parsePositiveInt(
    readString(config, 'MAIL_PORT'),
    DEFAULTS.mailPort,
  );
  const healthcheckDatabaseTimeoutMs = parsePositiveInt(
    readString(config, 'HEALTHCHECK_DATABASE_TIMEOUT_MS'),
    DEFAULTS.healthcheckDatabaseTimeoutMs,
  );
  const adminEmails = readString(config, 'ADMIN_EMAILS');
  const adminDefaultPassword = readString(config, 'ADMIN_DEFAULT_PASSWORD');
  const seedDemoUsers = parseBooleanString(
    readString(config, 'SEED_DEMO_USERS'),
    false,
  );

  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  }

  if (nodeEnv === 'production' && jwtSecret === 'change-me-in-production') {
    errors.push('JWT_SECRET must be overridden in production');
  }

  if (corsOrigins.length === 0) {
    errors.push('CORS_ORIGIN must contain at least one origin');
  }

  if (!storageRootPath) {
    errors.push('STORAGE_ROOT_PATH is required');
  }

  if (publicApiBaseUrl && !isHttpUrl(publicApiBaseUrl)) {
    errors.push('PUBLIC_API_BASE_URL must be a valid http/https URL');
  }

  if (appWebUrl && !isHttpUrl(appWebUrl)) {
    errors.push('APP_WEB_URL must be a valid http/https URL');
  }

  if (adminEmails && !adminDefaultPassword) {
    errors.push(
      'ADMIN_DEFAULT_PASSWORD is required when ADMIN_EMAILS is provided',
    );
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment variables:\n- ${errors.join('\n- ')}`);
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: String(port),
    API_PREFIX: apiPrefix,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    CORS_ORIGIN: corsOrigins.join(','),
    STORAGE_ROOT_PATH: storageRootPath,
    PUBLIC_API_BASE_URL: publicApiBaseUrl,
    APP_WEB_URL: appWebUrl,
    MAIL_PORT: String(mailPort),
    HEALTHCHECK_DATABASE_TIMEOUT_MS: String(healthcheckDatabaseTimeoutMs),
    ADMIN_EMAILS: adminEmails,
    ADMIN_DEFAULT_PASSWORD: adminDefaultPassword,
    SEED_DEMO_USERS: seedDemoUsers ? 'true' : 'false',
  };
}
