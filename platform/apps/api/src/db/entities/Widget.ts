import { Entity, type EntityItem } from 'electrodb';
import { WIDGET_STATUSES } from '../../services/widget/widgetTypes';
import { tableConfig } from '../client';

export const WidgetEntity = new Entity(
  {
    model: {
      entity: 'widget',
      version: '1',
      service: 'app',
    },
    attributes: {
      widgetId: { type: 'string', required: true },
      ownerId: { type: 'string', required: true },
      name: { type: 'string', required: true },
      description: { type: 'string' },
      status: {
        type: WIDGET_STATUSES,
        required: true,
        default: () => 'active',
      },
      createdAt: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => new Date().toISOString(),
      },
      updatedAt: {
        type: 'string',
        required: true,
        watch: '*',
        set: () => new Date().toISOString(),
        default: () => new Date().toISOString(),
      },
    },
    indexes: {
      byId: {
        pk: { field: 'pk', composite: ['widgetId'] },
        sk: { field: 'sk', composite: [] },
      },
      byOwner: {
        index: 'Gsi1Index',
        pk: { field: 'gsi1pk', composite: ['ownerId'] },
        sk: { field: 'gsi1sk', composite: ['createdAt', 'widgetId'] },
      },
    },
  },
  tableConfig,
);

export type WidgetEntityItem = EntityItem<typeof WidgetEntity>;
