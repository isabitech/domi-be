import Joi from 'joi';

export const branchSchemas = {
  list: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().min(1).optional()
    })
  }),
  get: Joi.object({
    params: Joi.object({ id: Joi.string().hex().length(24).required() })
  }),
  create: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).required(),
      code: Joi.string().alphanum().min(2).required(),
      address: Joi.string().allow('', null).optional(),
      phone: Joi.string().allow('', null).optional(),
      email: Joi.string().email().allow('', null).optional(),
      manager: Joi.string().hex().length(24).optional()
    })
  }),
  update: Joi.object({
    params: Joi.object({ id: Joi.string().hex().length(24).required() }),
    body: Joi.object({
      name: Joi.string().min(2).optional(),
      code: Joi.string().alphanum().min(2).optional(),
      address: Joi.string().allow('', null).optional(),
      phone: Joi.string().allow('', null).optional(),
      email: Joi.string().email().allow('', null).optional(),
      manager: Joi.string().hex().length(24).optional()
    })
  }),
  delete: Joi.object({
    params: Joi.object({ id: Joi.string().hex().length(24).required() })
  }),
  toggleStatus: Joi.object({
    params: Joi.object({ id: Joi.string().hex().length(24).required() })
  })
};
