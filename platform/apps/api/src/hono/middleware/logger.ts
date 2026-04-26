import type { MiddlewareHandler } from 'hono';

/** Structured JSON line per request — picked up by CloudWatch Logs Insights. */
export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const durationMs = Date.now() - start;
  const log = {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
  };
  console.log(JSON.stringify(log));
};
