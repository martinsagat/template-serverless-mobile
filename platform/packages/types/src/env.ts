import { z } from 'zod';

/**
 * Public env vars consumed by the web apps. Mirrors what infra/web.ts
 * injects via the SST Nextjs `environment` block.
 */
export const PublicEnvSchema = z.object({
  NEXT_PUBLIC_AWS_REGION: z.string().min(1),
  NEXT_PUBLIC_USER_POOL_ID: z.string().min(1),
  NEXT_PUBLIC_ADMIN_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_CONSUMER_CLIENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_ADMIN_API_URL: z.string().url(),
  NEXT_PUBLIC_CONSUMER_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;

/** Throws a single readable error if any required env var is missing/malformed. */
export function parseEnv(input: Record<string, string | undefined>): PublicEnv {
  return PublicEnvSchema.parse(input);
}
