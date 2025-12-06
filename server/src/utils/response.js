import {
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  DuplicateError,
  AppError
} from '../utils/errors.js';

const success = (res, data = {}, message = 'OK', statusCode = 200, meta) => {
  const payload = {
    success: true,
    data: data || undefined,
    message,
    timestamp: new Date().toISOString(),
    meta: meta || undefined
  };
  res.status(statusCode).json(payload);
};

const mapErrorCode = (err) => {
  if (err instanceof ValidationError) return 'VALIDATION_ERROR';
  if (err instanceof AuthError) return err.message && /credentials/i.test(err.message) ? 'INVALID_CREDENTIALS' : 'UNAUTHORIZED';
  if (err instanceof ForbiddenError) return 'FORBIDDEN';
  if (err instanceof NotFoundError) return 'NOT_FOUND';
  if (err instanceof DuplicateError) return 'DUPLICATE_ENTRY';
  if (err instanceof AppError) return 'SERVER_ERROR';
  return 'SERVER_ERROR';
};

const failure = (res, messageOrError = 'Error', statusCode = 500, errors = null, meta = null) => {
  let code = 'SERVER_ERROR';
  let message = messageOrError;
  let details = errors || null;

  if (messageOrError && typeof messageOrError === 'object' && messageOrError.statusCode) {
    const err = messageOrError;
    statusCode = err.statusCode || statusCode;
    message = err.message || message;
    details = err.meta?.details || details;
    code = mapErrorCode(err);
  } else if (messageOrError instanceof Error) {
    message = messageOrError.message;
    code = 'SERVER_ERROR';
  } else {
    code = 'SERVER_ERROR';
  }

  const payload = {
    success: false,
    error: {
      code,
      message,
      details: details || null,
      timestamp: new Date().toISOString()
    }
  };
  if (meta) payload.meta = meta;
  res.status(statusCode).json(payload);
};

export { success, failure };