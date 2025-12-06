
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

// Calculate current loan balance before saving (cumulative across all previous days)
loanRegisterSchema.pre('save', async function(next) {
  await this.calculateCumulativeLoanBalance();
  next();
});

// Calculate cumulative loan balance across all previous days
loanRegisterSchema.methods.calculateCumulativeLoanBalance = async function() {
  const LoanRegister = this.constructor;
  
  // Fetch branch to access multiplier
  let multiplier = 1;
  try {
    const Branch = (await import('./Branch.js')).default;
    const branch = await Branch.findById(this.branch).select('loanMultiplier');
    multiplier = branch?.loanMultiplier ?? 1;
  } catch (e) {
    // Use fallback multiplier if branch fetch fails
  }

  // Get all previous loan registers for this branch, sorted by date
  const previousRegisters = await LoanRegister.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 });

  // Sum all previous days' net loan changes (disbursements - collections)
  const allPreviousDaysLoanBalance = previousRegisters.reduce((sum, register) => {
    return sum + (register.loanDisbursementWithInterest - register.loanCollection);
  }, 0);

  // Calculate cumulative: (HO baseline × multiplier) + all previous days + current day
  this.currentLoanBalance = (this.previousLoanTotal * multiplier) + allPreviousDaysLoanBalance + (this.loanDisbursementWithInterest - this.loanCollection);
};

// Static method to recalculate all loan registers after a specific date
loanRegisterSchema.statics.calculateCumulativeLoanBalance = async function(branchId, fromDate = null) {
  const query = { branch: branchId };
  if (fromDate) {
    query.date = { $gte: fromDate };
  }

  const registers = await this.find(query).sort({ date: 1 });
  
  for (const register of registers) {
    await register.calculateCumulativeLoanBalance();
    await register.save({ validateBeforeSave: false });
  }
  
  return { updated: registers.length };
};

// Index for better query performance
loanRegisterSchema.index({ branch: 1, date: -1 });

export default mongoose.model('LoanRegister', loanRegisterSchema);