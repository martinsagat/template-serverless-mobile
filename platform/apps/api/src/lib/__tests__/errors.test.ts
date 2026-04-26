import { describe, expect, it } from 'vitest';
import { ServiceError } from '../errors';

describe('ServiceError', () => {
  it('notFound carries the resource name', () => {
    const err = ServiceError.notFound('Widget');
    expect(err).toBeInstanceOf(ServiceError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.resource).toBe('Widget');
    expect(err.message).toBe('Widget not found');
    expect(err.name).toBe('ServiceError');
  });

  it('invalidInput uses INVALID_INPUT code', () => {
    const err = ServiceError.invalidInput('name is required');
    expect(err.code).toBe('INVALID_INPUT');
    expect(err.message).toBe('name is required');
    expect(err.resource).toBeUndefined();
  });

  it('conflict uses CONFLICT code', () => {
    const err = ServiceError.conflict('email already taken');
    expect(err.code).toBe('CONFLICT');
  });

  it('unauthorized uses UNAUTHORIZED code with default message', () => {
    const err = ServiceError.unauthorized();
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Access denied');
  });

  it('validation uses VALIDATION code', () => {
    const err = ServiceError.validation('field X is malformed');
    expect(err.code).toBe('VALIDATION');
  });

  it('can be caught as Error', () => {
    function throwsServiceError() {
      throw ServiceError.notFound('Widget');
    }
    try {
      throwsServiceError();
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceError);
      expect(e).toBeInstanceOf(Error);
    }
  });
});
