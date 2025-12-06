import Joi from 'joi';

const id = Joi.string().hex().length(24);

export const cashbookSchemas = {
  list: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      type: Joi.string().valid('income','expense').optional(),
      category: Joi.string().optional(),
      status: Joi.string().valid('pending','approved','rejected').optional(),
      branch: id.optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      search: Joi.string().optional()
    })
  }),
  create: Joi.object({
    body: Joi.object({
      type: Joi.string().valid('income','expense').required(),
      category: Joi.string().min(2).allow(null),
      description: Joi.string().min(3).allow(null),
      amount: Joi.number().min(0).required(),
      paymentMethod: Joi.string().optional(),
      reference: Joi.string().allow(null),
      date: Joi.date().iso().optional(),
      notes: Joi.string().allow('', null).optional()
    })
  }),
  get: Joi.object({ params: Joi.object({ id: id.required() }) }),
  update: Joi.object({
    params: Joi.object({ id: id.required() }),
    body: Joi.object({
      type: Joi.string().valid('income','expense').optional(),
      category: Joi.string().min(2).optional(),
      description: Joi.string().min(3).optional(),
      amount: Joi.number().min(0).optional(),
      paymentMethod: Joi.string().optional(),
      reference: Joi.string().optional(),
      date: Joi.date().iso().optional(),
      notes: Joi.string().allow('', null).optional()
    })
  }),
  delete: Joi.object({ params: Joi.object({ id: id.required() }) }),
  updateStatus: Joi.object({
    params: Joi.object({ id: id.required() }),
    body: Joi.object({
      status: Joi.string().valid('approved','rejected').required(),
      notes: Joi.string().allow('', null).optional()
    })
  }),
  summary: Joi.object({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      branch: id.optional()
    })
  })
};
