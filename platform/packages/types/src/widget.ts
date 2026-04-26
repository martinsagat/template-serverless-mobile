import { z } from 'zod';

export const WIDGET_STATUSES = ['active', 'archived'] as const;
export type WidgetStatus = (typeof WIDGET_STATUSES)[number];

export const WidgetStatusSchema = z.enum(WIDGET_STATUSES);

export const WidgetDtoSchema = z.object({
  widgetId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: WidgetStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateWidgetInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  status: WidgetStatusSchema.optional(),
});

export const UpdateWidgetInputSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    status: WidgetStatusSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field is required',
  });

export const WidgetIdParamSchema = z.object({
  id: z.string().min(1),
});

export const ListWidgetsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const ListWidgetsResponseSchema = z.object({
  items: z.array(WidgetDtoSchema),
  nextCursor: z.string().optional(),
});

export type WidgetDto = z.infer<typeof WidgetDtoSchema>;
export type CreateWidgetInput = z.infer<typeof CreateWidgetInputSchema>;
export type UpdateWidgetInput = z.infer<typeof UpdateWidgetInputSchema>;
export type ListWidgetsResponse = z.infer<typeof ListWidgetsResponseSchema>;
