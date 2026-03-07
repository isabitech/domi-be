import Joi from 'joi';

export const amountNeedTomorrowSchema = Joi.object({
  loanAmount: Joi.number().min(0).default(0),
  savingsWithdrawalAmount: Joi.number().min(0).default(0),
  expensesAmount: Joi.number().min(0).default(0),
  notes: Joi.string().max(500).trim().allow(''),
  date: Joi.date().iso().optional()
});

export const amountNeedTomorrowUpdateSchema = amountNeedTomorrowSchema;

export const amountNeedTomorrowIdSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

export const amountNeedTomorrowDateSchema = Joi.object({
  date: Joi.date().iso().required()
});