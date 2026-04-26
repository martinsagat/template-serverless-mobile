import type { Context } from 'hono';
import { ServiceError } from '../../lib/errors';
import { ApiError } from './responses';

/**
 * Map a thrown error to an HTTP response. Use this in route handlers when you
 * want the route to swallow the throw and return a structured envelope:
 *
 *   try {
 *     return ApiSuccess.ok(c, await widgetService.create(input));
 *   } catch (err) {
 *     return mapServiceError(c, err, 'create widget');
 *   }
 *
 * If you don't catch in the route, the global errorHandler middleware uses
 * the same logic to convert ServiceError -> HTTP. The explicit form lets you
 * customise the fallback action label per-route.
 */
export function mapServiceError(
  c: Context,
  err: unknown,
  fallbackAction: string,
) {
  if (err instanceof ServiceError) {
    switch (err.code) {
      case 'NOT_FOUND':
        return ApiError.notFound(c, err.resource ?? 'Resource');
      case 'INVALID_INPUT':
      case 'VALIDATION':
        return ApiError.badRequest(c, err.message);
      case 'CONFLICT':
        return ApiError.conflict(c, err.message);
      case 'UNAUTHORIZED':
        return ApiError.forbidden(c, err.message);
    }
  }

  // Log unexpected errors so CloudWatch shows the underlying exception
  // (ElectroDB composite errors, AWS DDB errors, etc.) rather than swallowing
  // them behind a generic 500.
  c.get('log')?.error(
    `mapServiceError: unexpected error during ${fallbackAction}`,
    err,
  );
  return ApiError.serverError(c, fallbackAction);
}
