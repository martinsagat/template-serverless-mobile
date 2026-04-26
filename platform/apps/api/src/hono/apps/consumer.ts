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
import { widgetRoutes } from '../routes/consumer';

export const consumerApp = new OpenAPIHono<{ Variables: AuthVariables }>();

consumerApp.use('*', loggerMiddleware);
consumerApp.use('*', corsMiddleware);
consumerApp.onError(errorHandler);

consumerApp.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'App Consumer API', version: '1.0.0' },
});
consumerApp.get('/docs', swaggerUI({ url: '/openapi.json' }));

consumerApp.get('/health', (c) => c.json({ ok: true }));

consumerApp.use('/widgets/*', authMiddleware, requireGroup('consumer'));
consumerApp.route('/widgets', widgetRoutes);
