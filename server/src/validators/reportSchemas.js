import Joi from 'joi';

// Report query validation schemas
// Each schema validates req.query only; validation middleware wraps entire request
// Structure aligns with existing validation middleware expectations: { query: Joi.object({...}) }

export const reportSchemas = {
  daily: Joi.object({
    query: Joi.object({
      date: Joi.date().iso().optional(),
      branchId: Joi.string().hex().length(24).optional()
    })
  }),
  monthly: Joi.object({
    query: Joi.object({
      month: Joi.number().integer().min(1).max(12).optional(),
      year: Joi.number().integer().min(2000).max(2100).optional(),
      branchId: Joi.string().hex().length(24).optional()
    })
  }),
  consolidated: Joi.object({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional()
    }).with('startDate','endDate').with('endDate','startDate')
  }),
  custom: Joi.object({
    query: Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().required(),
      branchIds: Joi.string().optional(), // comma-separated list
      reportType: Joi.string().valid('summary','detailed','trends').optional(),
      groupBy: Joi.string().valid('day','week','month','branch').optional()
    })
  })
};
