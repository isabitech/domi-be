import Joi from 'joi';

export const biyeReportSchema = Joi.object({
  branch: Joi.string().hex().length(24).required(),
  disbursementNo: Joi.number().min(0).required(),
  disbursementAmount: Joi.number().min(0).required(),
  amountToClients: Joi.number().min(0).required(),
  ajoWithdrawalAmount: Joi.number().min(0).required(),
  totalClients: Joi.number().min(0).required(),
  ldSolvedToday: Joi.number().min(0).required(),
  clientsThatPaidToday: Joi.number().min(0).required(),
  ldResolutionMethods: Joi.array().items(
    Joi.string().valid('closed', 'properties', 'promise_undertaking', 'police')
  ),
  totalNoOfNewClientTomorrow: Joi.number().min(0).optional(),
  totalNoOfOldClientTomorrow: Joi.number().min(0).optional(),
  totalPreviousSoOwn: Joi.number().min(0).optional(),
  reportDate: Joi.date().iso().optional(),
  // System-calculated fields are not required from client
  totalAmountNeeded: Joi.forbidden(),
  currentLDNo: Joi.forbidden()
});
