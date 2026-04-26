import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import {
  CreateWidgetInputSchema,
  createWidget,
  deleteWidget,
  getWidget,
  ListWidgetsQuerySchema,
  ListWidgetsResponseSchema,
  listAllWidgets,
  UpdateWidgetInputSchema,
  updateWidget,
  WidgetDtoSchema,
  WidgetIdParamSchema,
} from '../../../services/widget';
import { type AuthVariables, getAuth } from '../../middleware/auth';

export const widgetRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['widgets'],
  request: { query: ListWidgetsQuerySchema },
  responses: {
    200: {
      description: 'List widgets',
      content: { 'application/json': { schema: ListWidgetsResponseSchema } },
    },
  },
});

widgetRoutes.openapi(listRoute, async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await listAllWidgets({ cursor, limit });
  return c.json(result, 200);
});

const createRouteDef = createRoute({
  method: 'post',
  path: '/',
  tags: ['widgets'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateWidgetInputSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Created',
      content: { 'application/json': { schema: WidgetDtoSchema } },
    },
  },
});

widgetRoutes.openapi(createRouteDef, async (c) => {
  const auth = getAuth(c);
  const body = c.req.valid('json');
  const widget = await createWidget(auth.userId, body);
  return c.json(widget, 201);
});

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['widgets'],
  request: { params: WidgetIdParamSchema },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: WidgetDtoSchema } },
    },
    404: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
    },
  },
});

widgetRoutes.openapi(getRoute, async (c) => {
  const { id } = c.req.valid('param');
  const widget = await getWidget(id);
  if (!widget) throw new HTTPException(404, { message: 'Widget not found' });
  return c.json(widget, 200);
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['widgets'],
  request: {
    params: WidgetIdParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateWidgetInputSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: WidgetDtoSchema } },
    },
  },
});

widgetRoutes.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const widget = await updateWidget(id, body);
  if (!widget) throw new HTTPException(404, { message: 'Widget not found' });
  return c.json(widget, 200);
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['widgets'],
  request: { params: WidgetIdParamSchema },
  responses: {
    204: { description: 'Deleted' },
  },
});

widgetRoutes.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid('param');
  await deleteWidget(id);
  return c.body(null, 204);
});
