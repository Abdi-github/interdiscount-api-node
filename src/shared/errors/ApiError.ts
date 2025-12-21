interface IApiError {
  statusCode: number;
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

class ApiError extends Error implements IApiError {
  public statusCode: number;
  public code: string;
  public field?: string;
  public details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    field?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, field?: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, field, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string, field?: string): ApiError {
    return new ApiError(409, 'CONFLICT', message, field);
  }

  static rateLimited(message = 'Too many requests'): ApiError {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

export default ApiError;
