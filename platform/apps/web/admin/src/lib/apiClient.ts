import { type ApiClient, createApiClient } from '@app/auth';
import { env } from './env';

let cached: ApiClient | undefined;

export function adminApi(): ApiClient {
  if (!cached)
    cached = createApiClient({ baseUrl: env().NEXT_PUBLIC_ADMIN_API_URL });
  return cached;
}
