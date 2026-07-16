import Joi from 'joi';

const id = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/);

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
      partnerReferrerPhone: phone.required(),
      status: Joi.string().valid('active', 'inactive').optional(),
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
      partnerReferrerPhone: phone.optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
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
