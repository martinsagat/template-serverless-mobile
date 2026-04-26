import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { createRequestLogger, type Logger } from '../../lib/logger';

/** Per-request log + requestId on the Hono context. Routes read via `c.get('log')`. */
declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    log: Logger;
  }
}

export const requestLogger = createMiddleware(
  async (c: Context, next: Next) => {
    const requestId =
      c.req.header('x-amzn-trace-id') ||
      c.req.header('x-request-id') ||
      crypto.randomUUID();
    const start = Date.now();

    const log = createRequestLogger();
    log.setContext({
      requestId,
      route: c.req.routePath,
      method: c.req.method,
    });

    c.set('requestId', requestId);
    c.set('log', log);

    await next();

    const durationMs = Date.now() - start;
    log.info('Request completed', {
      statusCode: c.res.status,
      durationMs,
      path: c.req.path,
    });
  },
);

/** Backwards-compat alias — old name used in pre-error-handling template. */
export const loggerMiddleware = requestLogger;
