import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { isDocsEnabled } from '../helpers/stage';
import {
  type AuthVariables,
  authMiddleware,
  corsMiddleware,
  errorHandler,
  requestLogger,
  requireGroup,
  validationHook,
} from '../middleware';
import { widgetRoutes } from '../routes/consumer';

export const consumerApp = new OpenAPIHono<{ Variables: AuthVariables }>({
  defaultHook: validationHook,
});

consumerApp.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Cognito JWT access token',
});

consumerApp.use('*', requestLogger);
consumerApp.use('*', corsMiddleware);
consumerApp.onError(errorHandler);

consumerApp.get('/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() }),
);

if (isDocsEnabled()) {
  consumerApp.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'App Consumer API', version: '1.0.0' },
    security: [{ bearerAuth: [] }],
  });
  consumerApp.get('/docs', swaggerUI({ url: '/openapi.json' }));
}

consumerApp.use('/widgets/*', authMiddleware, requireGroup('consumer'));
consumerApp.route('/widgets', widgetRoutes);
