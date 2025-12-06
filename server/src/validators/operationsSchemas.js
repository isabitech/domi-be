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
      // Cashbook1 fields (flat structure)
      pcih: numeric,
      savings: numeric,
      loanCollection: numeric,
      chargesCollection: numeric,
      // Cashbook2 fields (flat structure)
      disNo: numeric,
      disAmt: numeric,
      disWithInt: numeric,
      savWith: numeric,
      domiBank: numeric,
      posT: numeric,
      // Prediction fields (flat structure)
      predictionNo: numeric,
      predictionAmount: numeric,
      // Bank Statement 2 fields (flat structure)
      exAmt: numeric,
      exPurpose: Joi.string().optional()
    })
  }),
  submit: Joi.object({
    params: Joi.object({ id: id.required() })
  }),
  updateHOFields: Joi.object({
    body: Joi.object({
      branchId: id.required(),
      // Require explicit date so HO cannot accidentally update "today" by omission
      date: Joi.date().iso().required(),
      frmHO: numeric,
      frmBR: numeric,
      tbo: numeric,
      tboTargetBranch: id.optional(),
      previousLoanTotal: numeric,
      previousSavingsTotal: numeric,
      previousDisbursement: numeric,
      previousDisbursementRollNo: numeric,
      loanMultiplier: Joi.number().min(0).optional()
    })
  })
};
