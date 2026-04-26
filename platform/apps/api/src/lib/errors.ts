/**
 * ServiceError — domain-level error with a code that the HTTP layer maps to
 * the right status. Services throw these; routes catch them via mapServiceError
 * (or just let the global errorHandler convert them).
 *
 * Codes intentionally stay small. Add new ones only when an HTTP mapping needs
 * to change (e.g. a new status code or a new envelope shape).
 */
export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'VALIDATION';

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: ServiceErrorCode,
    public resource?: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  static notFound(resource: string) {
    return new ServiceError(`${resource} not found`, 'NOT_FOUND', resource);
  }

  static invalidInput(message: string) {
    return new ServiceError(message, 'INVALID_INPUT');
  }

  static conflict(message: string) {
    return new ServiceError(message, 'CONFLICT');
  }

  static unauthorized(message = 'Access denied') {
    return new ServiceError(message, 'UNAUTHORIZED');
  }

  static validation(message: string) {
    return new ServiceError(message, 'VALIDATION');
  }
}
