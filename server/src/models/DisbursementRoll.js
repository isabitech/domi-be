
/**
 * PRD Formula: Disbursement Roll
 * disbursementRoll = previousDisbursement + dailyDisbursement
 * - previousDisbursement: HO input (monthly)
 * - dailyDisbursement: sum of Cashbook2.disAmt for the month (system accumulated)
 * Permissions:
 *   - previousDisbursement: HO can edit
 *   - dailyDisbursement: system accumulated from daily ops
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
  // Amount-side fields
  previousDisbursement: {
    type: Number,
    default: 0 // HO input for amount baseline
  },
  currentDayDisbursement: {
    type: Number,
    default: 0 // From daily operations, defaulted to 0 until updated
  },
  currentDisbursement: {
    type: Number,
    default: 0 // Cumulative amount: prevDisbursement + allPreviousDays + currentDay
  },
  previousDisbursementRollNo: {
    type: Number,
    default: 0 // HO input
  },
  currentDayDisbursementRollNo: {
    type: Number,
    default: 0 // From daily operations, defaulted to 0 until updated
  },
  disbursementRoll: {
    type: Number,
    default: 0 // Cumulative: prevDisbursementRollNo + allPreviousDays + currentDay
  },
  disNo: {
    type: Number,
    required: true,
    default: 0
  },
}, {
  timestamps: true
});

// Calculate disbursement roll and amount before saving (cumulative across all previous days)
disbursementRollSchema.pre('save', async function(next) {
  await this.calculateCumulativeDisbursement();
  next();
});

// Calculate cumulative disbursement across all previous days (amount and roll no)
disbursementRollSchema.methods.calculateCumulativeDisbursement = async function() {
  const DisbursementRoll = this.constructor;
  
  // Get all previous disbursement rolls for this branch, sorted by date
  const previousRolls = await DisbursementRoll.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 });

  // Sum all previous days' disbursement amounts and roll numbers
  const { allPreviousDaysAmount, allPreviousDaysRollNo } = previousRolls.reduce(
    (acc, roll) => {
      acc.allPreviousDaysAmount += roll.currentDayDisbursement || 0;
      acc.allPreviousDaysRollNo += roll.currentDayDisbursementRollNo || 0;
      return acc;
    },
    { allPreviousDaysAmount: 0, allPreviousDaysRollNo: 0 }
  );

  // Amount-side cumulative: prevDisbursement + all previous days + current day
  this.currentDisbursement =
    (this.previousDisbursement || 0) +
    allPreviousDaysAmount +
    (this.currentDayDisbursement || 0);

  // Roll number cumulative: prevDisbursementRollNo + all previous days + current day
  this.disbursementRoll =
    (this.previousDisbursementRollNo || 0) +
    allPreviousDaysRollNo +
    (this.currentDayDisbursementRollNo || 0);
};

// Static method to recalculate all disbursement rolls after a specific date
disbursementRollSchema.statics.calculateCumulativeDisbursement = async function(branchId, fromDate = null) {
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