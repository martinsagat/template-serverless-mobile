/**
 * Date normalization. Always store ISO 8601 UTC strings in DynamoDB so range
 * queries and sorting work lexicographically.
 */

function assertValidDate(date: Date, input: string | number | Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${String(input)}`);
  }
  return date;
}

/** Normalize any Date / ISO string / Unix ms to an ISO string. Throws on garbage. */
export function normalizeUtcIsoString(value: Date | string | number): string {
  if (value instanceof Date) {
    return assertValidDate(value, value).toISOString();
  }
  return assertValidDate(new Date(value), value).toISOString();
}

/** Like normalizeUtcIsoString but returns "now" when value is undefined. */
export function toIsoString(value: Date | string | number | undefined): string {
  if (value == null) return new Date().toISOString();
  return normalizeUtcIsoString(value);
}

/** Returns undefined for null/undefined input — useful for optional fields. */
export function toIsoStringOrUndefined(
  value: Date | string | number | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  return normalizeUtcIsoString(value);
}
