/**
 * Pagination util for list endpoints.
 *
 * - parsePaginationOptions: parse limit/nextToken from API Gateway query params.
 * - encodeNextToken / decodeNextToken: opaque base64url JSON cursor.
 * - electroCursorToNextToken: convert ElectroDB's cursor (string or JSON) to a token.
 * - encodeSearchCursor / decodeSearchCursor: offset-based cursor for filtered lists.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Parsed options for the service layer: limit + decoded lastKey for DDB startAt. */
export interface ParsedPaginationOptions {
  limit: number;
  lastKey?: Record<string, unknown>;
}

interface QueryStringEvent {
  queryStringParameters?: unknown;
}

/**
 * Parses limit + nextToken from API Gateway event query string parameters.
 * Returns a capped limit and decoded lastKey suitable for DynamoDB query/scan.
 *
 * Pass `maxLimit` to raise the cap for specific endpoints (e.g. admin export).
 */
export function parsePaginationOptions(
  event: QueryStringEvent,
  opts?: { maxLimit?: number },
): ParsedPaginationOptions {
  const params: Record<string, string> = {};
  const raw = event.queryStringParameters;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string') params[k] = v;
    }
  }
  const maxLimit = opts?.maxLimit ?? MAX_PAGE_SIZE;
  let limit = DEFAULT_PAGE_SIZE;
  const rawLimit = params.limit;
  if (rawLimit !== undefined && rawLimit !== '') {
    const n = Number.parseInt(rawLimit, 10);
    if (!Number.isNaN(n) && n >= 1) {
      limit = Math.min(n, maxLimit);
    }
  }
  const nextToken = params.nextToken?.trim();
  const lastKey = nextToken ? decodeNextToken(nextToken) : undefined;
  return { limit, lastKey };
}

/** Decodes an opaque nextToken (base64url JSON) to a DDB LastEvaluatedKey shape. */
export function decodeNextToken(
  token: string,
): Record<string, unknown> | undefined {
  if (!token || typeof token !== 'string') return undefined;
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // invalid token — fall through
  }
  return undefined;
}

/** Encodes a DDB lastKey (e.g. ElectroDB cursor) to an opaque nextToken. */
export function encodeNextToken(
  lastKey: Record<string, unknown> | undefined,
): string | undefined {
  if (!lastKey || Object.keys(lastKey).length === 0) return undefined;
  try {
    return Buffer.from(JSON.stringify(lastKey), 'utf8').toString('base64url');
  } catch {
    return undefined;
  }
}

/**
 * Converts an ElectroDB cursor into an API nextToken.
 *
 * ElectroDB cursors come in two shapes depending on the operation:
 *   - JSON string of the LastEvaluatedKey (starts with `{`)
 *   - base64url-encoded JSON (commonly looks like `eyJ...`)
 *
 * The token we expose is always base64url JSON so `decodeNextToken` round-trips.
 */
export function electroCursorToNextToken(
  cursor: string | null | undefined,
): string | undefined {
  if (!cursor || typeof cursor !== 'string') return undefined;
  const trimmed = cursor.trim();
  if (!trimmed) return undefined;

  // JSON cursor (LastEvaluatedKey JSON string).
  if (trimmed.startsWith('{')) {
    try {
      return encodeNextToken(JSON.parse(trimmed) as Record<string, unknown>);
    } catch {
      return undefined;
    }
  }

  // base64url cursor — already suitable, but validate it decodes to an object.
  const decoded = decodeNextToken(trimmed);
  return decoded ? trimmed : undefined;
}

/** Search cursor payload for offset-based pagination of filtered lists. */
export interface SearchCursor {
  searchOffset: number;
  search: string;
}

export function encodeSearchCursor(offset: number, search: string): string {
  return Buffer.from(
    JSON.stringify({ searchOffset: offset, search }),
    'utf8',
  ).toString('base64url');
}

export function decodeSearchCursor(
  token: string | undefined,
): SearchCursor | undefined {
  if (!token || typeof token !== 'string') return undefined;
  try {
    const parsed = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8'),
    ) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'searchOffset' in parsed &&
      'search' in parsed
    ) {
      const { searchOffset, search } = parsed as SearchCursor;
      if (typeof searchOffset === 'number' && typeof search === 'string') {
        return { searchOffset, search };
      }
    }
  } catch {
    // invalid token
  }
  return undefined;
}
