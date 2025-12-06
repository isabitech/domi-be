import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

export const validate = (schema) => (req, _res, next) => {
  const toValidate = {
    body: req.body,
    params: req.params,
    query: req.query
  };
  const { error, value } = schema.validate(toValidate, { abortEarly: false, allowUnknown: true });
  if (error) {
    const details = error.details.map(d => ({ message: d.message, path: d.path }));
    return next(new ValidationError('Validation failed', { details }));
  }
  // Replace validated data
  req.body = value.body;
  req.params = value.params;
  // Some environments have read-only getters for req.query — avoid direct assignment
  try {
    req.query = value.query;
  } catch (e) {
    // Fallback: copy validated keys into existing req.query object
    if (value.query && typeof value.query === 'object') {
      Object.keys(value.query).forEach((k) => {
        try { req.query[k] = value.query[k]; } catch (_) { /* ignore */ }
      });
    }
  }
  next();
};

// Example schemas (can be moved to separate folder later)
// Auth schemas moved to validators/authSchemas.js for consistency.