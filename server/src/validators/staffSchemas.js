import Joi from 'joi';

const id = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/);

export const staffSchemas = {
  list: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      branchId: id.optional(),
      search: Joi.string().trim().optional(),
      gender: Joi.string().valid('male', 'female').optional()
    })
  }),
  create: Joi.object({
    body: Joi.object({
      staffName: Joi.string().trim().required(),
      staffIdNumber: Joi.string().trim().required(),
      employmentDate: Joi.date().iso().required(),
      currentPosition: Joi.string().trim().required(),
      currentBranch: Joi.string().trim().required(),
      branchId: id.required(),
      residentialAddress: Joi.string().trim().required(),
      guarantorName: Joi.string().trim().required(),
      guarantorNumber: phone.required(),
      gender: Joi.string().valid('male', 'female').required()
    })
  }),
  update: Joi.object({
    params: Joi.object({ id: id.required() }),
    body: Joi.object({
      staffName: Joi.string().trim().optional(),
      staffIdNumber: Joi.string().trim().optional(),
      employmentDate: Joi.date().iso().optional(),
      currentPosition: Joi.string().trim().optional(),
      currentBranch: Joi.string().trim().optional(),
      branchId: id.optional(),
      residentialAddress: Joi.string().trim().optional(),
      guarantorName: Joi.string().trim().optional(),
      guarantorNumber: phone.optional(),
      gender: Joi.string().valid('male', 'female').optional()
    }).min(1)
  }),
  delete: Joi.object({
    params: Joi.object({ id: id.required() })
  })
};
