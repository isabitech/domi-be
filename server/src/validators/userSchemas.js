import Joi from 'joi';

const id = Joi.string().hex().length(24);

export const userSchemas = {
  list: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      role: Joi.string().valid('HO','BR','employee','manager','admin').optional(),
      status: Joi.string().valid('active','inactive','suspended').optional()
    })
  }),
  create: Joi.object({
    body: Joi.object({
      username: Joi.string().alphanum().min(3).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      role: Joi.string().valid('HO','BR','employee','manager','admin').required(),
      branchId: id.allow(null).optional()
    })
  }),
  update: Joi.object({
    params: Joi.object({ id: id.required() }),
    body: Joi.object({
      username: Joi.string().alphanum().min(3).max(50).optional(),
      email: Joi.string().email().optional(),
      role: Joi.string().valid('HO','BR','employee','manager','admin').optional(),
      branchId: id.allow(null).optional(),
      status: Joi.string().valid('active','inactive','suspended').optional()
    })
  }),
  delete: Joi.object({ params: Joi.object({ id: id.required() }) })
};
