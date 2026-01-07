
/**
 * PRD Formula: Disbursement Roll
 * disbursementRoll = previousDisbursement + dailyDisbursementAmount
 * - previousDisbursement: HO input (baseline disbursement amount)
 * - dailyDisbursement: sum of Cashbook2.disAmt for all days (cumulative)
 * 
 * disNo = previousDisbursementRollNo + dailyDisbursementNumbers  
 * - previousDisbursementRollNo: HO input (baseline disbursement number)
 * - dailyDisbursementNumbers: sum of Cashbook2.disNo for all days (cumulative)
 * 
 * Permissions:
 *   - previousDisbursement: HO can edit
 *   - currentDayDisbursementAmount: system accumulated from Cashbook2.disAmt
 *   - disbursementRoll: system calculated, viewable by both HO and BR
 */
import mongoose from 'mongoose';

const disbursementRollSchema = new mongoose.Schema({
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
  previousDisbursement: {
    type: Number,
    default: 0 // HO input - baseline disbursement amount
  },
  previousDisbursementRollNo: {
    type: Number,
    default: 0 // HO input - baseline disbursement number
  },
  dailyDisbursement: {
    type: Number,
    default: 0 // Daily disbursement amount from Cashbook2.disAmt
  },
  currentDayDisbursementRollNo: {
    type: Number,
    default: 0 // Daily disbursement number from Cashbook2.disNo
  },
  disbursementRoll: {
    type: Number,
    default: 0 // Cumulative: monthly baseline + all previous day amounts + current day
  },
  disNo: {
    type: Number,
    required: true,
    default: 0 // Cumulative: monthly baseline + all previous day numbers + current day
  },
}, {
  timestamps: true
});

// Calculate disbursement roll before saving (cumulative across the current month)
disbursementRollSchema.pre('save', async function(next) {
  await this.calculateCumulativeDisbursement();
  next();
});

// Calculate cumulative disbursement across all previous days in the same month
disbursementRollSchema.methods.calculateCumulativeDisbursement = async function() {
  const DisbursementRoll = this.constructor;

  // Start of the current month
  const startOfMonth = new Date(this.date.getFullYear(), this.date.getMonth(), 1);
  
  // Get all previous disbursement rolls for this branch in the current month
  const previousRolls = await DisbursementRoll.find({
    branch: this.branch,
    date: { $lt: this.date, $gte: startOfMonth }
  }).sort({ date: 1 });

  // Sum previous days' disbursement amounts and numbers
  const allPreviousDayAmounts = previousRolls.reduce((sum, roll) => sum + (roll.dailyDisbursement || 0), 0);
  const allPreviousDayNumbers = previousRolls.reduce((sum, roll) => sum + (roll.currentDayDisbursementRollNo || 0), 0);

  // Reset baseline if this is the first roll of the month
  const isFirstOfMonth = previousRolls.length === 0;
  const baselineDisbursement = isFirstOfMonth ? 0 : this.previousDisbursement || 0;
  const baselineDisNo = isFirstOfMonth ? 0 : this.previousDisbursementRollNo || 0;

  // Calculate cumulative disbursement roll (amount)
  this.disbursementRoll = baselineDisbursement + allPreviousDayAmounts + (this.dailyDisbursement || 0);

  // Calculate cumulative disbursement number
  this.disNo = baselineDisNo + allPreviousDayNumbers + (this.currentDayDisbursementRollNo || 0);
};

// Static method to recalculate all disbursement rolls after a specific date
disbursementRollSchema.statics.recalculateFromDate = async function(branchId, fromDate = null) {
  const query = { branch: branchId };
  if (fromDate) {
    query.date = { $gte: fromDate };
  }

  const rolls = await this.find(query).sort({ date: 1 });
  
  for (const roll of rolls) {
    await roll.calculateCumulativeDisbursement();
    await roll.save({ validateBeforeSave: false });
  }
  
  return { updated: rolls.length };
};

// Index for better query performance
disbursementRollSchema.index({ branch: 1, date: -1 });

export default mongoose.model('DisbursementRoll', disbursementRollSchema);
