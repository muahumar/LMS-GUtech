export type ErrorCode = 
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown[];

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details?: unknown[]) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Permission denied') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }

  static unprocessable(message: string, details?: unknown[]) {
    return new AppError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new AppError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Internal server error') {
    return new AppError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}
