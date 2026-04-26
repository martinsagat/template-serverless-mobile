import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  decodeNextToken,
  decodeSearchCursor,
  electroCursorToNextToken,
  encodeNextToken,
  encodeSearchCursor,
  MAX_PAGE_SIZE,
  parsePaginationOptions,
} from '../pagination';

describe('encode/decode nextToken', () => {
  it('round-trips an object', () => {
    const key = { pk: 'WIDGET#1', sk: 'WIDGET#1' };
    const token = encodeNextToken(key);
    expect(token).toBeDefined();
    expect(decodeNextToken(token ?? '')).toEqual(key);
  });

  it('returns undefined for empty input', () => {
    expect(encodeNextToken(undefined)).toBeUndefined();
    expect(encodeNextToken({})).toBeUndefined();
    expect(decodeNextToken('')).toBeUndefined();
    expect(decodeNextToken('!!!not-base64!!!')).toBeUndefined();
  });

  it('rejects non-object decoded payloads', () => {
    const arrToken = Buffer.from(JSON.stringify([1, 2, 3])).toString(
      'base64url',
    );
    expect(decodeNextToken(arrToken)).toBeUndefined();
    const stringToken = Buffer.from(JSON.stringify('plain')).toString(
      'base64url',
    );
    expect(decodeNextToken(stringToken)).toBeUndefined();
  });
});

describe('parsePaginationOptions', () => {
  it('returns defaults when no params', () => {
    const opts = parsePaginationOptions({});
    expect(opts.limit).toBe(DEFAULT_PAGE_SIZE);
    expect(opts.lastKey).toBeUndefined();
  });

  it('caps limit at MAX_PAGE_SIZE', () => {
    const opts = parsePaginationOptions({
      queryStringParameters: { limit: '999' },
    });
    expect(opts.limit).toBe(MAX_PAGE_SIZE);
  });

  it('honours custom maxLimit', () => {
    const opts = parsePaginationOptions(
      { queryStringParameters: { limit: '500' } },
      { maxLimit: 250 },
    );
    expect(opts.limit).toBe(250);
  });

  it('decodes nextToken into lastKey', () => {
    const token = encodeNextToken({ pk: 'A', sk: 'B' }) ?? '';
    const opts = parsePaginationOptions({
      queryStringParameters: { limit: '10', nextToken: token },
    });
    expect(opts.limit).toBe(10);
    expect(opts.lastKey).toEqual({ pk: 'A', sk: 'B' });
  });

  it('ignores garbage limit', () => {
    const opts = parsePaginationOptions({
      queryStringParameters: { limit: 'abc' },
    });
    expect(opts.limit).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('electroCursorToNextToken', () => {
  it('handles JSON-string cursor', () => {
    const json = JSON.stringify({ pk: 'X', sk: 'Y' });
    const token = electroCursorToNextToken(json);
    expect(token).toBeDefined();
    expect(decodeNextToken(token ?? '')).toEqual({ pk: 'X', sk: 'Y' });
  });

  it('passes through valid base64url cursor', () => {
    const original = encodeNextToken({ pk: 'X', sk: 'Y' }) ?? '';
    expect(electroCursorToNextToken(original)).toBe(original);
  });

  it('returns undefined for null/empty', () => {
    expect(electroCursorToNextToken(null)).toBeUndefined();
    expect(electroCursorToNextToken(undefined)).toBeUndefined();
    expect(electroCursorToNextToken('')).toBeUndefined();
  });
});

describe('search cursor', () => {
  it('round-trips offset + search', () => {
    const token = encodeSearchCursor(42, 'foo');
    expect(decodeSearchCursor(token)).toEqual({
      searchOffset: 42,
      search: 'foo',
    });
  });

  it('rejects malformed', () => {
    expect(decodeSearchCursor('garbage')).toBeUndefined();
    const wrongShape = Buffer.from(JSON.stringify({ x: 1 })).toString(
      'base64url',
    );
    expect(decodeSearchCursor(wrongShape)).toBeUndefined();
  });
});
