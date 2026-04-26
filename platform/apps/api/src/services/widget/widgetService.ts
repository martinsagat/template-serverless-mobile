import { randomUUID } from 'node:crypto';
import { WidgetEntity, type WidgetEntityItem } from '../../db/entities/Widget';
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

export async function getWidget(widgetId: string): Promise<WidgetDto | null> {
  const result = await WidgetEntity.get({ widgetId }).go();
  return result.data ? toDto(result.data) : null;
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

export async function updateWidget(
  widgetId: string,
  input: UpdateWidgetInput,
): Promise<WidgetDto | null> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  const result = await WidgetEntity.patch({ widgetId })
    .set(patch as never)
    .go({ response: 'all_new' });
  return result.data ? toDto(result.data as WidgetEntityItem) : null;
}

export async function deleteWidget(widgetId: string): Promise<void> {
  await WidgetEntity.delete({ widgetId }).go();
}

export class WidgetOwnershipError extends Error {
  constructor(message = 'Widget does not belong to caller') {
    super(message);
    this.name = 'WidgetOwnershipError';
  }
}

/** Used by consumer routes: confirms the widget belongs to the caller. */
export async function getOwnedWidget(
  widgetId: string,
  ownerId: string,
): Promise<WidgetDto | null> {
  const widget = await getWidget(widgetId);
  if (!widget) return null;
  if (widget.ownerId !== ownerId) throw new WidgetOwnershipError();
  return widget;
}
