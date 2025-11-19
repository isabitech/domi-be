export class AppError extends Error {
  constructor(message, statusCode = 500, meta = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.meta = meta;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', meta) {
    super(message, 400, meta);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed', meta) {
    super(message, 401, meta);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', meta) {
    super(message, 403, meta);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', meta) {
    super(message, 404, meta);
  }
}

export class DuplicateError extends AppError {
  constructor(message = 'Duplicate resource', meta) {
    super(message, 409, meta);
  }
}

export const mapMongooseError = (err) => {
  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return new ValidationError('Validation failed', { details });
  }
  if (err?.name === 'CastError') {
    return new NotFoundError('Resource not found');
  }
  if (err?.code === 11000) {
    return new DuplicateError('Duplicate field value', { keyValue: err.keyValue });
  }
  return null;
};