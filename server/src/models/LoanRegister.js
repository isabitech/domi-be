
/**
 * PRD Formula: Current Branch Register (Loan)
 * currentLoanBalance = (previousLoanTotal * loanMultiplier) + loanDisbursementWithInterest - loanCollection
 * - previousLoanTotal: HO input (monthly)
 * - loanDisbursementWithInterest: from Cashbook2.disWithInt (daily)
 * - loanCollection: from Cashbook1.loanCollection (daily)
 * - loanMultiplier: HO input (per branch, see Branch model)
 * Permissions:
 *   - previousLoanTotal, loanMultiplier: HO can edit
 *   - loanDisbursementWithInterest, loanCollection: BR can input via daily ops
 *   - currentLoanBalance: system calculated, viewable by both HO and BR
 */
import mongoose from 'mongoose';

const loanRegisterSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  previousLoanTotal: {
    type: Number,
    default: 0 // HO input monthly
  },
  loanDisbursementWithInterest: {
    type: Number,
    default: 0 // From Cashbook2 disWithInt
  },
  loanCollection: {
    type: Number,
    default: 0 // From Cashbook1 loanCollection
  },
  currentLoanBalance: {
    type: Number,
    default: 0 // Calculated: (Previous total * loanMultiplier) + DisbursementWithInterest - Collection
  }
}, {
  timestamps: true
});

// Calculate current loan balance before saving (cumulative approach)
loanRegisterSchema.pre('save', async function(next) {
  await this.calculateCumulativeLoanBalance();
  next();
});

// Method to calculate cumulative loan balance including all previous days
loanRegisterSchema.methods.calculateCumulativeLoanBalance = async function() {
  const LoanRegister = this.constructor;
  
  // Get all previous loan register entries for this branch before current date
  const previousEntries = await LoanRegister.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 }).lean();
  
  // Sum up all previous days' net loan balance (disbursement - collection)
  const cumulativePreviousNetLoan = previousEntries.reduce((sum, entry) => {
    return sum + (entry.loanDisbursementWithInterest || 0) - (entry.loanCollection || 0);
  }, 0);
  
  // Current day net loan balance
  const currentDayNetLoan = (this.loanDisbursementWithInterest || 0) - (this.loanCollection || 0);
  
  // Final cumulative calculation: previousLoanTotal + all previous days net + current day net
  this.currentLoanBalance = (this.previousLoanTotal || 0) + cumulativePreviousNetLoan + currentDayNetLoan;
};

// Static method to recalculate loan balance for current day and all subsequent days
loanRegisterSchema.statics.recalculateFromDate = async function(branchId, fromDate) {
  const LoanRegister = this;
  
  // Find all loan register entries for this branch from the given date onwards
  const entries = await LoanRegister.find({
    branch: branchId,
    date: { $gte: fromDate }
  }).sort({ date: 1 });
  
  // Recalculate each entry in chronological order
  for (const entry of entries) {
    await entry.calculateCumulativeLoanBalance();
    await entry.save({ validateBeforeSave: false }); // Skip validation to avoid infinite loop
  }
};

// Index for better query performance
loanRegisterSchema.index({ branch: 1, date: -1 });

export default mongoose.model('LoanRegister', loanRegisterSchema);