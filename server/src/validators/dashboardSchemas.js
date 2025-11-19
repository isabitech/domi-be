import Joi from 'joi';

export const dashboardSchemas = {
  branch: Joi.object({
    query: Joi.object({
      date: Joi.date().iso().optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional()
    })
  }),
  ho: Joi.object({
    query: Joi.object({
      date: Joi.date().iso().optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional()
    })
  })
};
