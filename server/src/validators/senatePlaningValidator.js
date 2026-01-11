import Joi from 'joi';

export const senatePlaningSchema = Joi.object({
  noOfDisbursement: Joi.number().integer().min(0).required(),
  amountToClients: Joi.number().min(0).required(),
  disbursementAmount: Joi.number().min(0).required(),
  notes: Joi.string().allow('').required()
});

export const senatePlaningSchemas = {
  create: senatePlaningSchema
};
