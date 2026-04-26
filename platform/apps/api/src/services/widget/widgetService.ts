import { randomUUID } from 'node:crypto';
import { WidgetEntity, type WidgetEntityItem } from '../../db/entities/Widget';
import { ServiceError } from '../../lib/errors';
import type {
  CreateWidgetInput,
  ListWidgetsResponse,
  UpdateWidgetInput,
  WidgetDto,
} from './widgetTypes';

const DEFAULT_PAGE_SIZE = 25;

function toDto(item: WidgetEntityItem): WidgetDto {
  return {
    widgetId: item.widgetId,
    ownerId: item.ownerId,
    name: item.name,
    description: item.description,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function encodeCursor(cursor: unknown): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(
  token: string | undefined,
): Record<string, unknown> | undefined {
  if (!token) return undefined;
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }
}

export async function createWidget(
  ownerId: string,
  input: CreateWidgetInput,
): Promise<WidgetDto> {
  const widgetId = randomUUID();
  const result = await WidgetEntity.create({
    widgetId,
    ownerId,
    name: input.name,
    description: input.description,
    status: input.status ?? 'active',
  }).go();
  return toDto(result.data);
}

/** Throws ServiceError.notFound if the widget does not exist. */
export async function getWidget(widgetId: string): Promise<WidgetDto> {
  const result = await WidgetEntity.get({ widgetId }).go();
  if (!result.data) throw ServiceError.notFound('Widget');
  return toDto(result.data);
}

export async function listWidgetsByOwner(
  ownerId: string,
  opts: { cursor?: string; limit?: number } = {},
): Promise<ListWidgetsResponse> {
  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const result = await WidgetEntity.query
    .byOwner({ ownerId })
    .go({ limit, cursor: decodeCursor(opts.cursor) as never });
  return {
    items: result.data.map(toDto),
    nextCursor: result.cursor ? encodeCursor(result.cursor) : undefined,
  };
}

export async function listAllWidgets(
  opts: { cursor?: string; limit?: number } = {},
): Promise<ListWidgetsResponse> {
  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const result = await WidgetEntity.scan.go({
    limit,
    cursor: decodeCursor(opts.cursor) as never,
  });
  return {
    items: result.data.map(toDto),
    nextCursor: result.cursor ? encodeCursor(result.cursor) : undefined,
  };
}

/** Throws ServiceError.notFound if the widget does not exist. */
export async function updateWidget(
  widgetId: string,
  input: UpdateWidgetInput,
): Promise<WidgetDto> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  const result = await WidgetEntity.patch({ widgetId })
    .set(patch as never)
    .go({ response: 'all_new' });
  if (!result.data) throw ServiceError.notFound('Widget');
  return toDto(result.data as WidgetEntityItem);
}

export async function deleteWidget(widgetId: string): Promise<void> {
  await WidgetEntity.delete({ widgetId }).go();
}

/** Used by consumer routes: throws if the widget doesn't exist or doesn't belong to the caller. */
export async function getOwnedWidget(
  widgetId: string,
  ownerId: string,
): Promise<WidgetDto> {
  const widget = await getWidget(widgetId); // throws notFound
  if (widget.ownerId !== ownerId) {
    throw ServiceError.unauthorized('Widget does not belong to caller');
  }
  return widget;
}
