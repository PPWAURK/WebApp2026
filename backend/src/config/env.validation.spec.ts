import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('rejects a relative storage path in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'mysql://db_user:db_password@127.0.0.1:3306/webapp2026',
        JWT_SECRET: 'test-secret',
        CORS_ORIGIN: 'https://app.example.com',
        STORAGE_ROOT_PATH: 'uploads',
      }),
    ).toThrow('STORAGE_ROOT_PATH must be an absolute path in production');
  });

  it('accepts an absolute storage path in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'mysql://db_user:db_password@127.0.0.1:3306/webapp2026',
        JWT_SECRET: 'test-secret',
        CORS_ORIGIN: 'https://app.example.com',
        STORAGE_ROOT_PATH: '/data/storage',
      }),
    ).not.toThrow();
  });
});
