import type { Context } from 'hono';

/**
 * Named HTTP error responses with a consistent envelope. Prefer these over
 * `c.json({ error }, status)` so the response shape is uniform.
 *
 * Add more named helpers as your app grows recurring 4xx patterns — keep them
 * domain-specific (e.g. `ApiError.notInMerchantGroup(c)`), not generic.
 */
export const ApiError = {
  // 400
  badRequest: (c: Context, message = 'Bad request') =>
    c.json({ error: message }, 400),
  validationError: (c: Context, details: unknown) =>
    c.json({ error: 'Validation error', details }, 400),
  missingParam: (c: Context, param: string) =>
    c.json({ error: `Missing ${param}` }, 400),
  invalidJsonBody: (c: Context) => c.json({ error: 'Invalid JSON body' }, 400),

  // 401
  unauthorized: (c: Context, message = 'Unauthenticated') =>
    c.json({ error: message }, 401),

  // 403
  forbidden: (c: Context, message = 'Access denied') =>
    c.json({ error: message }, 403),
  accessDenied: (c: Context, resource = 'this resource') =>
    c.json({ error: `Access denied to ${resource}` }, 403),

  // 404
  notFound: (c: Context, resource: string) =>
    c.json({ error: `${resource} not found` }, 404),

  // 409
  conflict: (c: Context, message: string) => c.json({ error: message }, 409),

  // 429
  tooManyRequests: (c: Context, retryAfterSeconds?: number) => {
    if (retryAfterSeconds) c.header('Retry-After', String(retryAfterSeconds));
    return c.json({ error: 'Too many requests' }, 429);
  },

  // 500
  serverError: (c: Context, action: string) =>
    c.json({ error: `Failed to ${action}` }, 500),
} as const;

export interface DeleteResponse {
  deleted: true;
}

export const ApiSuccess = {
  ok: <T>(c: Context, data: T) => c.json(data as object),
  created: <T>(c: Context, data: T) => c.json(data as object, 201),
  deleted: (c: Context) => c.json<DeleteResponse>({ deleted: true }),
} as const;
