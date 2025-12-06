// Pure financial calculation helpers extracted for unit testing
// All inputs coerced to numbers; undefined/null treated as 0.

function n(v) { return typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0; }

export function computeCbTotal1(pcih, savings, loanCollection, chargesCollection, frmHO, frmBR) {
  return n(pcih) + n(savings) + n(loanCollection) + n(chargesCollection) + n(frmHO) + n(frmBR);
}

export function computeCbTotal2(disAmt, savWith, domiBank, posT) {
  return n(disAmt) + n(savWith) + n(domiBank) + n(posT);
}

export function computeOnlineCIH(cbTotal1, cbTotal2) {
  return n(cbTotal1) - n(cbTotal2);
}

export function computeTSO(bs1Total, bs2Total) {
  return n(bs1Total) - n(bs2Total);
}

export function computeCurrentLoanBalance(previousLoanTotal, loanDisbursementWithInterest, loanCollection, multiplier = 1) {
  return n(previousLoanTotal) * n(multiplier) + n(loanDisbursementWithInterest) - n(loanCollection);
}

export function computeCurrentSavings(savings, previousSavingsTotal, savingsWithdrawal) {
  return n(savings) + n(previousSavingsTotal) - n(savingsWithdrawal);
}

export function computeDisbursementRoll(previousDisbursement, dailyDisbursement) {
  return n(previousDisbursement) + n(dailyDisbursement);
}

// Backwards-compatible alias exports (legacy naming used in OperationsService)
export const calcOnlineCIH = computeOnlineCIH;
export const calcTSO = computeTSO;

// Single default export object (removed earlier duplicate)
export default {
  computeCbTotal1,
  computeCbTotal2,
  computeOnlineCIH,
  computeTSO,
  computeCurrentLoanBalance,
  computeCurrentSavings,
  computeDisbursementRoll,
  // include aliases for consumers using older names
  calcOnlineCIH,
  calcTSO
};
