import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { WidgetOwnershipError } from '../../services/widget';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof ZodError) {
    return c.json<ErrorEnvelope>(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: err.issues,
        },
      },
      400,
    );
  }
  if (err instanceof HTTPException) {
    return c.json<ErrorEnvelope>(
      {
        error: {
          code:
            err.status === 401
              ? 'UNAUTHENTICATED'
              : err.status === 403
                ? 'FORBIDDEN'
                : 'HTTP_ERROR',
          message: err.message,
        },
      },
      err.status,
    );
  }
  if (err instanceof WidgetOwnershipError) {
    return c.json<ErrorEnvelope>(
      {
        error: { code: 'FORBIDDEN', message: err.message },
      },
      403,
    );
  }
  console.error('Unhandled error', err);
  return c.json<ErrorEnvelope>(
    {
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    },
    500,
  );
}
