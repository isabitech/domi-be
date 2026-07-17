import Joi from 'joi';

const id = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/);

export const investorsSchemas = {
  list: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().trim().optional(),
      gender: Joi.string().valid('male', 'female').optional(),
      status: Joi.string().valid('paid', 'update', 'withdrawal').optional()
    })
  }),
  create: Joi.object({
    body: Joi.object({
      investorName: Joi.string().trim().required(),
      gender: Joi.string().valid('male', 'female').required(),
      phone: phone.required(),
      rioDate: Joi.date().iso().required(),
      status: Joi.string().valid('paid', 'update', 'withdrawal').required()
    })
  }),
  update: Joi.object({
    params: Joi.object({ id: id.required() }),
    body: Joi.object({
      investorName: Joi.string().trim().optional(),
      gender: Joi.string().valid('male', 'female').optional(),
      phone: phone.optional(),
      rioDate: Joi.date().iso().optional(),
      status: Joi.string().valid('paid', 'update', 'withdrawal').optional()
    }).min(1)
  }),
  delete: Joi.object({
    params: Joi.object({ id: id.required() })
  })
};