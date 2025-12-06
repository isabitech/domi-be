
/**
 * PRD Formula: Current Branch Register (Savings)
 * currentSavings = savings + previousSavingsTotal - savingsWithdrawal
 * - previousSavingsTotal: HO input (monthly)
 * - savings: from Cashbook1.savings (daily)
 * - savingsWithdrawal: from Cashbook2.savWith (daily)
 * Permissions:
 *   - previousSavingsTotal: HO can edit
 *   - savings: BR can input via daily ops
 *   - savingsWithdrawal: BR can input via daily ops
 *   - currentSavings: system calculated, viewable by both HO and BR
 */
import mongoose from 'mongoose';

const savingsRegisterSchema = new mongoose.Schema({
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
  previousSavingsTotal: {
    type: Number,
    default: 0 // HO input
  },
  savings: {
    type: Number,
    default: 0 // From Cashbook1
  },
  savingsWithdrawal: {
    type: Number,
    default: 0 // From Cashbook2 savWith
  },
  currentSavings: {
    type: Number,
    default: 0 // Calculated: Savings + Previous total - Savings withdrawal
  }
}, {
  timestamps: true
});

// Calculate current savings before saving (cumulative across all previous days)
savingsRegisterSchema.pre('save', async function(next) {
  await this.calculateCumulativeSavings();
  next();
});

// Calculate cumulative savings across all previous days
savingsRegisterSchema.methods.calculateCumulativeSavings = async function() {
  const SavingsRegister = this.constructor;
  
  // Get all previous savings registers for this branch, sorted by date
  const previousRegisters = await SavingsRegister.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 });

  // Sum all previous days' net savings (savings - withdrawals)
  const allPreviousDaysSavings = previousRegisters.reduce((sum, register) => {
    return sum + (register.savings - register.savingsWithdrawal);
  }, 0);

  // Calculate cumulative: HO baseline + all previous days + current day
  this.currentSavings = this.previousSavingsTotal + allPreviousDaysSavings + (this.savings - this.savingsWithdrawal);
};

// Static method to recalculate all savings registers after a specific date
savingsRegisterSchema.statics.calculateCumulativeSavings = async function(branchId, fromDate = null) {
  const query = { branch: branchId };
  if (fromDate) {
    query.date = { $gte: fromDate };
  }

  const registers = await this.find(query).sort({ date: 1 });
  
  for (const register of registers) {
    await register.calculateCumulativeSavings();
    await register.save({ validateBeforeSave: false });
  }
  
  return { updated: registers.length };
};

// Index for better query performance
savingsRegisterSchema.index({ branch: 1, date: -1 });

export default mongoose.model('SavingsRegister', savingsRegisterSchema);