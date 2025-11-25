import Joi from 'joi';

export const settingsSchemas = {
  system: Joi.object({ body: Joi.object({
    appName: Joi.string().optional(),
    companyName: Joi.string().optional(),
    defaultCurrency: Joi.string().valid('NGN','USD','EUR').optional(),
    financialYearStart: Joi.date().iso().optional(),
    maxDailyTransactionLimit: Joi.number().min(0).optional(),
    autoBackupTime: Joi.string().optional(),
    sessionTimeoutMinutes: Joi.number().integer().min(5).max(120).optional(),
    auditTrailEnabled: Joi.boolean().optional()
  })}),
  financial: Joi.object({ body: Joi.object({
    defaultLoanInterestRate: Joi.number().min(0).max(100).optional(),
    savingsInterestRate: Joi.number().min(0).max(100).optional(),
    processingFeePercentage: Joi.number().min(0).max(100).optional(),
    latePaymentPenalty: Joi.number().min(0).max(100).optional(),
    minimumSavingsAmount: Joi.number().min(0).optional(),
    maximumLoanAmount: Joi.number().min(0).optional(),
    dailyWithdrawalLimit: Joi.number().min(0).optional(),
    transactionApprovalsEnabled: Joi.boolean().optional()
  })}),
  security: Joi.object({ body: Joi.object({
    minPasswordLength: Joi.number().integer().min(6).optional(),
    passwordRequirements: Joi.object({ uppercase: Joi.boolean().optional(), lowercase: Joi.boolean().optional(), numbers: Joi.boolean().optional(), specialChars: Joi.boolean().optional() }).optional(),
    passwordExpiryDays: Joi.number().integer().optional(),
    twoFactorAuthEnabled: Joi.boolean().optional(),
    loginAttemptLimit: Joi.number().integer().optional(),
    accountLockoutMinutes: Joi.number().integer().optional(),
    ipWhitelistEnabled: Joi.boolean().optional()
  })}),
  notifications: Joi.object({ body: Joi.object({
    emailNotifications: Joi.object({ dailyReports: Joi.boolean().optional(), lowBalanceAlerts: Joi.boolean().optional(), transactionAlerts: Joi.boolean().optional(), systemMaintenance: Joi.boolean().optional() }).optional(),
    reportSchedule: Joi.string().valid('daily','weekly','monthly').optional(),
    recipients: Joi.array().items(Joi.string().email()).optional(),
    smsGateway: Joi.string().valid('disabled','twilio','nexmo','local').optional()
  })})
};
