import type { Context } from 'hono';
import type { ZodError } from 'zod';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ZodError };

/**
 * Pass to `new OpenAPIHono({ defaultHook: validationHook })` so every route's
 * zod-validated input gets a uniform 400 response on failure.
 *
 * Using `defaultHook` means routes don't need to repeat error handling for
 * validation; the global errorHandler still catches non-validation throws.
 */
export const validationHook = <T>(
  result: ValidationResult<T>,
  c: Context,
): Response | undefined => {
  if (!result.success) {
    return c.json(
      {
        error: 'Validation error',
        issues: result.error.issues,
      },
      400,
    );
  }
};
