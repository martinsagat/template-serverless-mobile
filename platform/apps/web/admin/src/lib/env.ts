import { type PublicEnv, parseEnv } from '@app/types';

/**
 * Reads + validates public env vars lazily on first use, so `next build` (which
 * is run by SST during deploy after env vars are injected) doesn't crash on a
 * fresh clone where .env hasn't been populated yet.
 *
 * NEXT_PUBLIC_* vars are inlined into the client bundle by Next, so the actual
 * `process.env.NEXT_PUBLIC_*` reads here are evaluated at build time.
 */
let cached: PublicEnv | undefined;

export function env(): PublicEnv {
  if (!cached) {
    cached = parseEnv({
      NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
      NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
      NEXT_PUBLIC_ADMIN_CLIENT_ID: process.env.NEXT_PUBLIC_ADMIN_CLIENT_ID,
      NEXT_PUBLIC_ADMIN_API_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL,
      NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN:
        process.env.NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN,
    });
  }
  return cached;
}
