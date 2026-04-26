import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ErrorHandler } from 'hono/types';
import { ZodError } from 'zod';
import { ServiceError } from '../../lib/errors';
import { logger as fallbackLogger } from '../../lib/logger';

/**
 * Last-resort error handler. Routes can either:
 *
 *   - Catch and call `mapServiceError(c, err, '...')` for explicit control, or
 *   - Let the throw bubble — this handler converts it to a structured response.
 *
 * Always logs to the request-scoped logger (so requestId is in the line),
 * falling back to the module logger for code paths that run before the
 * requestLogger middleware (e.g. CORS preflight failures).
 */
export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  const log = c.get('log') ?? fallbackLogger;
  const requestId = c.get('requestId') ?? 'unknown';
  const route = c.req.routePath;

  // Zod schema failures from `@hono/zod-openapi` / `@hono/zod-validator`.
  if (err instanceof ZodError) {
    log.warn('Validation error', { requestId, route, issues: err.issues });
    return c.json({ error: 'Validation error', issues: err.issues }, 400);
  }

  // ServiceError -> domain-specific status mapping.
  if (err instanceof ServiceError) {
    switch (err.code) {
      case 'NOT_FOUND':
        return c.json(
          { error: `${err.resource ?? 'Resource'} not found` },
          404,
        );
      case 'INVALID_INPUT':
      case 'VALIDATION':
        return c.json({ error: err.message }, 400);
      case 'CONFLICT':
        return c.json({ error: err.message }, 409);
      case 'UNAUTHORIZED':
        return c.json({ error: err.message }, 403);
    }
  }

  // Hono's own HTTPException — used by middleware for 401/403 etc.
  if (err instanceof HTTPException) {
    log.warn('HTTPException', {
      requestId,
      route,
      status: err.status,
      message: err.message,
    });
    return c.json({ error: err.message }, err.status);
  }

  // Anything else — log full stack and return generic 500.
  log.error('Unhandled error', err, { requestId, route, path: c.req.path });
  return c.json({ error: 'Internal server error' }, 500);
};
