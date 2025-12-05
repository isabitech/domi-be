
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

// Method to calculate cumulative savings including all previous days
savingsRegisterSchema.methods.calculateCumulativeSavings = async function() {
  const SavingsRegister = this.constructor;
  
  // Get all previous savings register entries for this branch before current date
  const previousEntries = await SavingsRegister.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 }).lean();
  
  // Sum up all previous days' net savings (savings - withdrawals)
  const cumulativePreviousSavings = previousEntries.reduce((sum, entry) => {
    return sum + (entry.savings || 0) - (entry.savingsWithdrawal || 0);
  }, 0);
  
  // Final cumulative calculation
  this.currentSavings = (this.previousSavingsTotal || 0) + cumulativePreviousSavings + (this.savings || 0) - (this.savingsWithdrawal || 0);
};

// Calculate current savings before saving
savingsRegisterSchema.pre('save', async function(next) {
  await this.calculateCumulativeSavings();
  next();
});

// Static method to recalculate savings for current day and all subsequent days
savingsRegisterSchema.statics.recalculateFromDate = async function(branchId, fromDate) {
  const SavingsRegister = this;
  
  // Find all savings register entries for this branch from the given date onwards
  const entries = await SavingsRegister.find({
    branch: branchId,
    date: { $gte: fromDate }
  }).sort({ date: 1 });
  
  // Recalculate each entry in chronological order
  for (const entry of entries) {
    await entry.calculateCumulativeSavings();
    await entry.save({ validateBeforeSave: false }); // Skip validation to avoid infinite loop
  }
};

// Index for better query performance
savingsRegisterSchema.index({ branch: 1, date: -1 });

export default mongoose.model('SavingsRegister', savingsRegisterSchema);