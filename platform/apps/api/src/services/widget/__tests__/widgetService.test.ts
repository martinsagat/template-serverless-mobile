import { describe, expect, it } from 'vitest';
import {
  CreateWidgetInputSchema,
  UpdateWidgetInputSchema,
  WidgetDtoSchema,
} from '../widgetTypes';

describe('widget schemas', () => {
  it('CreateWidgetInputSchema accepts a minimal payload', () => {
    const parsed = CreateWidgetInputSchema.parse({ name: 'Hello' });
    expect(parsed.name).toBe('Hello');
    expect(parsed.status).toBeUndefined();
  });

  it('CreateWidgetInputSchema rejects empty name', () => {
    expect(() => CreateWidgetInputSchema.parse({ name: '' })).toThrow();
  });

  it('UpdateWidgetInputSchema requires at least one field', () => {
    expect(() => UpdateWidgetInputSchema.parse({})).toThrow(
      /At least one field/,
    );
  });

  it('WidgetDtoSchema validates a full widget', () => {
    const dto = {
      widgetId: 'w_1',
      ownerId: 'u_1',
      name: 'Test',
      description: 'd',
      status: 'active' as const,
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
    };
    const parsed = WidgetDtoSchema.parse(dto);
    expect(parsed).toEqual(dto);
  });
});
