import Joi from 'joi';

const id = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/);
const partnerPhone = Joi.alternatives().try(
  phone,
  Joi.string().trim().valid('None', 'none', 'NONE')
);

export const clientsSchemas = {
  list: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      branchId: id.optional(),
      search: Joi.string().trim().optional(),
      status: Joi.string().valid('active', 'inactive').optional()
    })
  }),
  getById: Joi.object({
    params: Joi.object({ id: id.required() })
  }),
  create: Joi.object({
    body: Joi.object({
      union: Joi.string().trim().required(),
      clientName: Joi.string().trim().required(),
      clientPhone: phone.required(),
      clientNickName: Joi.string().trim().allow('').optional(),
      guarantorName: Joi.string().trim().required(),
      guarantorPhone: phone.required(),
      guarantorNickName: Joi.string().trim().allow('').optional(),
      partnerReferrerName: Joi.string().trim().required(),
      partnerReferrerPhone: partnerPhone.required(),
      partnerReferrerNickName: Joi.string().trim().allow('', null).optional(),
      clientCategory: Joi.string().valid('loan_only', 'savings_only', 'loan_and_savings').optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      disbursementDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().allow('').optional(), Joi.valid(null)).optional(),
      branchId: id.optional()
    })
  }),
  update: Joi.object({
    params: Joi.object({ id: id.required() }),
    body: Joi.object({
      union: Joi.string().trim().optional(),
      clientName: Joi.string().trim().optional(),
      clientPhone: phone.optional(),
      clientNickName: Joi.string().trim().allow('').optional(),
      guarantorName: Joi.string().trim().optional(),
      guarantorPhone: phone.optional(),
      guarantorNickName: Joi.string().trim().allow('').optional(),
      partnerReferrerName: Joi.string().trim().optional(),
      partnerReferrerPhone: partnerPhone.optional(),
      partnerReferrerNickName: Joi.string().trim().allow('', null).optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      clientCategory: Joi.string().valid('loan_only', 'savings_only', 'loan_and_savings').optional(),
      disbursementDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().allow('').optional(), Joi.valid(null)).optional(),
      branchId: id.optional()
    }).min(1)
  }),
  delete: Joi.object({
    params: Joi.object({ id: id.required() })
  }),
  summary: Joi.object({
    query: Joi.object({})
  })
};
