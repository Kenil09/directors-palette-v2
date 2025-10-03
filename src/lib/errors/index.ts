/**
 * Base error class for application-specific errors
 */
export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number

  constructor(message: string, public readonly originalError?: unknown) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR'
  readonly statusCode = 500

  constructor(message: string, originalError?: unknown) {
    super(message, originalError)
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND'
  readonly statusCode = 404

  constructor(resource: string) {
    super(`${resource} not found`)
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400

  constructor(message: string, public readonly field?: string) {
    super(message)
  }
}

/**
 * Business logic errors
 */
export class BusinessError extends AppError {
  readonly code = 'BUSINESS_ERROR'
  readonly statusCode = 400

  constructor(message: string, public readonly businessCode?: string) {
    super(message)
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR'
  readonly statusCode = 401

  constructor(message: string = 'Authentication required') {
    super(message)
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR'
  readonly statusCode = 403

  constructor(message: string = 'Access denied') {
    super(message)
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends AppError {
  readonly code = 'EXTERNAL_API_ERROR'
  readonly statusCode = 502

  constructor(
    message: string,
    public readonly service: string,
    originalError?: unknown
  ) {
    super(message, originalError)
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_ERROR'
  readonly statusCode = 429

  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message)
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR'
  readonly statusCode = 500

  constructor(message: string, public readonly configKey?: string) {
    super(message)
  }
}

/**
 * File operation errors
 */
export class FileError extends AppError {
  readonly code = 'FILE_ERROR'
  readonly statusCode = 500

  constructor(
    message: string,
    public readonly operation: string,
    public readonly filePath?: string,
    originalError?: unknown
  ) {
    super(message, originalError)
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR'
  readonly statusCode = 503

  constructor(message: string, originalError?: unknown) {
    super(message, originalError)
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  readonly code = 'TIMEOUT_ERROR'
  readonly statusCode = 408

  constructor(
    message: string = 'Operation timed out',
    public readonly timeoutMs?: number
  ) {
    super(message)
  }
}

/**
 * Conflict errors (e.g., duplicate resources)
 */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT_ERROR'
  readonly statusCode = 409

  constructor(message: string, public readonly conflictField?: string) {
    super(message)
  }
}

/**
 * Utility function to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Utility function to get error details for logging
 */
export function getErrorDetails(error: unknown): {
  message: string
  code?: string
  statusCode?: number
  originalError?: unknown
} {
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      originalError: error.originalError,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
    }
  }

  return {
    message: 'Unknown error occurred',
    originalError: error,
  }
}

/**
 * Utility function to format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: {
    message: string
    code: string
    statusCode: number
  }
} {
  const details = getErrorDetails(error)

  return {
    error: {
      message: details.message,
      code: details.code || 'UNKNOWN_ERROR',
      statusCode: details.statusCode || 500,
    },
  }
}