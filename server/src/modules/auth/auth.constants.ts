export const AUTH_ROLES_KEY = 'auth_roles';

export const DEFAULT_JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24;

const TEST_JWT_SECRET = 'eccomers-test-jwt-secret';

export function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (jwtSecret) {
    return jwtSecret;
  }

  if (process.env.NODE_ENV === 'test') {
    return TEST_JWT_SECRET;
  }

  throw new Error(
    'JWT_SECRET is required to start the API. Define it in your environment variables before booting the server.',
  );
}
