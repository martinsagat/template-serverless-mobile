import { describe, expect, it } from 'vitest';
import {
  normalizeUtcIsoString,
  toIsoString,
  toIsoStringOrUndefined,
} from '../dates';
import { normalizeEmail } from '../normalizeEmail';
import { compareVersions } from '../semver';

describe('dates', () => {
  it('normalizeUtcIsoString accepts Date / ISO string / Unix ms', () => {
    expect(normalizeUtcIsoString(new Date('2026-04-26T00:00:00Z'))).toBe(
      '2026-04-26T00:00:00.000Z',
    );
    expect(normalizeUtcIsoString('2026-04-26T00:00:00Z')).toBe(
      '2026-04-26T00:00:00.000Z',
    );
    expect(normalizeUtcIsoString(1745625600000)).toMatch(
      /^2025-04-26T00:00:00/,
    );
  });

  it('normalizeUtcIsoString throws on garbage', () => {
    expect(() => normalizeUtcIsoString('not-a-date')).toThrow(/Invalid date/);
    expect(() => normalizeUtcIsoString(Number.NaN)).toThrow(/Invalid date/);
  });

  it('toIsoString returns now when input is undefined', () => {
    const before = Date.now();
    const out = toIsoString(undefined);
    const t = new Date(out).getTime();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('toIsoStringOrUndefined preserves nullish', () => {
    expect(toIsoStringOrUndefined(undefined)).toBeUndefined();
    expect(toIsoStringOrUndefined(null)).toBeUndefined();
    expect(toIsoStringOrUndefined('2026-04-26T00:00:00Z')).toBe(
      '2026-04-26T00:00:00.000Z',
    );
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });
  it('is idempotent', () => {
    const once = normalizeEmail('A@B.com');
    expect(normalizeEmail(once)).toBe(once);
  });
});

describe('compareVersions', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.0.0', '1.0.1', -1],
    ['1.10.0', '1.2.0', 1],
    ['2.0.0', '1.9.9', 1],
    ['v2.3.0', '2.3.0', 0],
    ['2', '2.0.0', 0],
    ['2.3', '2.3.0', 0],
    ['abc.def', '0.0.0', 0],
  ] as const)('compareVersions(%s, %s) = %s', (a, b, expected) => {
    expect(compareVersions(a, b)).toBe(expected);
  });
});
