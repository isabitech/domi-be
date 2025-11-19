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
  req.query = value.query;
  next();
};

// Example schemas (can be moved to separate folder later)
// Auth schemas moved to validators/authSchemas.js for consistency.