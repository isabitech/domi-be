import Joi from 'joi';

export const auditSchemas = {
  list: Joi.object({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      userId: Joi.string().hex().length(24).optional(),
      action: Joi.string().optional(),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(200).optional()
    })
  })
};
