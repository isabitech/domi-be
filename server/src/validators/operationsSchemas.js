import Joi from 'joi';

const id = Joi.string().hex().length(24);

const numeric = Joi.number().min(0).optional();

const cashbook1 = Joi.object({
  pcih: numeric,
  savings: numeric,
  loanCollection: numeric,
  chargesCollection: numeric,
  frmHO: numeric,
  frmBR: numeric,
  cbTotal1: numeric
}).optional();

const cashbook2 = Joi.object({
  disNo: numeric,
  disAmt: numeric,
  disWithInt: numeric,
  savWith: numeric,
  domiBank: numeric,
  posT: numeric,
  cbTotal2: numeric
}).optional();

const prediction = Joi.object({
  predictionNo: numeric,
  predictionAmount: numeric
}).optional();

const bankStatement1 = Joi.object({
  bs1Total: numeric
}).optional();

const bankStatement2 = Joi.object({
  bs2Total: numeric
}).optional();

const loanRegister = Joi.object({
  previousLoanTotal: numeric,
  currentLoanBalance: numeric
}).optional();

const savingsRegister = Joi.object({
  previousSavingsTotal: numeric,
  currentSavings: numeric
}).optional();

export const operationsSchemas = {
  getDaily: Joi.object({
    query: Joi.object({
      date: Joi.date().iso().optional(),
      branchId: id.optional()
    })
  }),
  createOrUpdate: Joi.object({
    body: Joi.object({
      date: Joi.date().iso().optional(),
      branchId: id.optional(),
      cashbook1,
      cashbook2,
      prediction,
      bankStatement1,
      bankStatement2,
      loanRegister,
      savingsRegister
    })
  }),
  submit: Joi.object({
    params: Joi.object({ id: id.required() })
  }),
  updateHOFields: Joi.object({
    body: Joi.object({
      branchId: id.required(),
      date: Joi.date().iso().optional(),
      frmHO: numeric,
      frmBR: numeric,
      tbo: numeric,
      tboTargetBranch: id.optional(),
      previousLoanTotal: numeric,
      previousSavingsTotal: numeric,
      previousDisbursement: numeric,
      loanMultiplier: Joi.number().min(0).optional()
    })
  })
};
