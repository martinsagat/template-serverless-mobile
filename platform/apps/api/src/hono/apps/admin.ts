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
import { widgetRoutes } from '../routes/admin';

export const adminApp = new OpenAPIHono<{ Variables: AuthVariables }>({
  defaultHook: validationHook,
});

// Bearer-token security scheme — surfaces "Authorize" button in Swagger UI.
adminApp.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Cognito JWT access token',
});

adminApp.use('*', requestLogger);
adminApp.use('*', corsMiddleware);
adminApp.onError(errorHandler);

adminApp.get('/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() }),
);

if (isDocsEnabled()) {
  adminApp.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'App Admin API', version: '1.0.0' },
    security: [{ bearerAuth: [] }],
  });
  adminApp.get('/docs', swaggerUI({ url: '/openapi.json' }));
}

// Auth-gated routes.
adminApp.use('/widgets/*', authMiddleware, requireGroup('admin'));
adminApp.route('/widgets', widgetRoutes);
