// Financial calculation helpers aligned with PRD while retaining MongoDB.
// All monetary values are treated as integer kobo (Number) to avoid FP drift.
// Conversion helpers (if UI sends naira decimals) can be applied before persistence.

import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import BankStatement1 from '../models/BankStatement1.js';
import BankStatement2 from '../models/BankStatement2.js';
import Prediction from '../models/Prediction.js';
import AuditLog from '../models/AuditLog.js';

// Safe integer arithmetic wrapper (currently simple pass-through; kept for future BigInt migration)
export const add = (...vals) => vals.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);

// Previous Cash In Hand = previous day's Online CIH
export async function calculatePCIH(branchId, currentDate) {
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);

  const c1 = await Cashbook1.findOne({ branch: branchId, date: { $lte: prevDate } }).sort({ date: -1 });
  if (!c1) return 0;
  const c2 = await Cashbook2.findOne({ branch: branchId, date: c1.date });
  const cbTotal2 = c2?.cbTotal2 || 0;
  return c1.cbTotal1 - cbTotal2;
}

export function calculateCashbook1Totals(doc) {
  const collectionTotal = add(doc.savings, doc.loanCollection, doc.chargesCollection);
  const cbTotal1 = add(doc.pcih, collectionTotal, doc.frmHO, doc.frmBR);
  return { collectionTotal, cbTotal1 };
}

export function calculateCashbook2Totals(doc) {
  const cbTotal2 = add(doc.disAmt, doc.savWith, doc.domiBank, doc.posT);
  return { cbTotal2 };
}

export function calculateOnlineCIH(cbTotal1, cbTotal2) {
  return cbTotal1 - cbTotal2;
}

export async function generateBankStatement1(branchId, date) {
  const c1 = await Cashbook1.findOne({ branch: branchId, date });
  const c2 = await Cashbook2.findOne({ branch: branchId, date });
  if (!c1 || !c2) return null;
  const doc = await BankStatement1.findOneAndUpdate(
    { branch: branchId, date },
    {
      opening: 0,
      recHO: c1.frmHO,
      recBO: c1.frmBR,
      domi: c2.domiBank,
      pa: c2.posT
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

export async function generateBankStatement2(branchId, date, overrides = {}) {
  const c1 = await Cashbook1.findOne({ branch: branchId, date });
  if (!c1) return null;
  const doc = await BankStatement2.findOneAndUpdate(
    { branch: branchId, date },
    {
      withd: c1.frmHO, // per PRD mapping
      tbo: overrides.tboAmount || 0,
      tboTargetBranch: overrides.tboToBranchId || null,
      exAmt: overrides.exAmt || 0,
      exPurpose: overrides.exPurpose || null
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

export async function calculateCurrentBranchRegisterSavings(branchId, date) {
  const c1 = await Cashbook1.findOne({ branch: branchId, date });
  const c2 = await Cashbook2.findOne({ branch: branchId, date });
  if (!c1 || !c2) return 0;
  // Placeholder previous total (would come from a monthly rollover collection)
  const prevTotalSavings = 0;
  return prevTotalSavings + c1.savings - c2.savWith;
}

export async function calculateCurrentBranchRegisterLoan(branchId, date) {
  const c1 = await Cashbook1.findOne({ branch: branchId, date });
  const c2 = await Cashbook2.findOne({ branch: branchId, date });
  if (!c1 || !c2) return 0;
  const prevTotalLoan = 0;
  return prevTotalLoan + c2.disWithInt - c1.loanCollection;
}

export async function calculateTSO(branchId, date) {
  const bs1 = await BankStatement1.findOne({ branch: branchId, date });
  const bs2 = await BankStatement2.findOne({ branch: branchId, date });
  if (!bs1 || !bs2) return 0;
  return bs1.bs1Total - bs2.bs2Total;
}

export async function calculateDisbursementRoll(branchId, date) {
  const c2 = await Cashbook2.findOne({ branch: branchId, date });
  if (!c2) return 0;
  const prevDisbursement = 0; // Placeholder until monthly rollover implemented
  return prevDisbursement + c2.disAmt;
}

// Audit convenience wrapper for financial calculations (lightweight event)
export async function auditFinancial(user, action, resource, resourceId, meta = {}) {
  try {
    await AuditLog.create({
      userId: user?._id || user?.id,
      username: user?.username,
      action,
      resource,
      resourceId,
      newValue: meta,
      ipAddress: user?.ipAddress,
      userAgent: user?.userAgent
    });
  } catch (_) {
    // Silent fail; do not break transactional flow
  }
}

export default {
  calculatePCIH,
  calculateCashbook1Totals,
  calculateCashbook2Totals,
  calculateOnlineCIH,
  generateBankStatement1,
  generateBankStatement2,
  calculateCurrentBranchRegisterSavings,
  calculateCurrentBranchRegisterLoan,
  calculateTSO,
  calculateDisbursementRoll,
  auditFinancial
};
