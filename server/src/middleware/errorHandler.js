import logger from '../utils/logger.js';
import { AppError, mapMongooseError } from '../utils/errors.js';
import { failure } from '../utils/response.js';

const errorHandler = (err, req, res, _next) => {
  // Map known mongoose errors
  const mapped = mapMongooseError(err);
  if (mapped) {
    err = mapped;
  }

  if (!(err instanceof AppError)) {
    logger.error({
      type: 'unhandled',
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });
    err = new AppError(err.message || 'Internal Server Error', 500);
  } else {
    logger.error({
      type: 'operational',
      message: err.message,
      statusCode: err.statusCode,
      meta: err.meta,
      path: req.originalUrl,
      method: req.method
    });
  }

  failure(res, err.message, err.statusCode, err.meta?.details);
};

export default errorHandler;