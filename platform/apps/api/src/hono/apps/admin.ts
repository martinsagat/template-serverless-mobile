import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  type AuthVariables,
  authMiddleware,
  corsMiddleware,
  errorHandler,
  loggerMiddleware,
  requireGroup,
} from '../middleware';
import { widgetRoutes } from '../routes/admin';

export const adminApp = new OpenAPIHono<{ Variables: AuthVariables }>();

adminApp.use('*', loggerMiddleware);
adminApp.use('*', corsMiddleware);
adminApp.onError(errorHandler);

// Public docs.
adminApp.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'App Admin API', version: '1.0.0' },
});
adminApp.get('/docs', swaggerUI({ url: '/openapi.json' }));

adminApp.get('/health', (c) => c.json({ ok: true }));

// Auth-gated routes.
adminApp.use('/widgets/*', authMiddleware, requireGroup('admin'));
adminApp.route('/widgets', widgetRoutes);
