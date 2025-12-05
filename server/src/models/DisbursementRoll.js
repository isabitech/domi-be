
/**
 * PRD Formula: Disbursement Roll (Daily Cumulative)
 * disbursementRoll = previousDisbursement + sum of all previous days' disbursements + current day disbursement
 * disNo = previousDisbursementRollNo + sum of all previous days' disbursement numbers + current day disbursement number
 * - previousDisbursement: HO input (baseline)
 * - previousDisbursementRollNo: HO input (baseline number)
 * - dailyDisbursement: from Cashbook2.disAmt (daily input)
 * - dailyDisNo: from Cashbook2.disNo (daily input)
 * - disbursementRoll: cumulative disbursement total (output)
 * - disNo: cumulative disbursement count (output)
 * Permissions:
 *   - previousDisbursement, previousDisbursementRollNo: HO can edit
 *   - dailyDisbursement, dailyDisNo: BR can input via daily ops
 *   - disbursementRoll, disNo: system calculated cumulative, viewable by both HO and BR
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
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  previousDisbursement: {
    type: Number,
    default: 0 // HO input baseline
  },
  previousDisbursementRollNo: {
    type: Number,
    default: 0 // HO input baseline number
  },
  dailyDisbursement: {
    type: Number,
    default: 0 // Current day disbursement amount from Cashbook2.disAmt (daily input)
  },
  dailyDisNo: {
    type: Number,
    default: 0 // Current day disbursement number from Cashbook2.disNo (daily input)
  },
  disbursementRoll: {
    type: Number,
    default: 0 // Cumulative: Previous Disbursement + All Previous Days + Current Day
  },
  disNo: {
    type: Number,
    default: 0 // Cumulative: Previous Roll No + All Previous Days + Current Day
  },
}, {
  timestamps: true
});

// Calculate cumulative disbursement roll before saving
disbursementRollSchema.pre('save', async function(next) {
  await this.calculateCumulativeDisbursement();
  next();
});

// Method to calculate cumulative disbursement including all previous days
disbursementRollSchema.methods.calculateCumulativeDisbursement = async function() {
  const DisbursementRoll = this.constructor;
  
  // Get all previous disbursement roll entries for this branch before current date
  const previousEntries = await DisbursementRoll.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 }).lean();
  
  // Sum up all previous days' disbursements and numbers
  const cumulativePreviousDisbursement = previousEntries.reduce((sum, entry) => {
    return sum + (entry.dailyDisbursement || 0);
  }, 0);
  
  const cumulativePreviousNumbers = previousEntries.reduce((sum, entry) => {
    return sum + (entry.dailyDisNo || 0);
  }, 0);
  
  // Final cumulative calculations
  this.disbursementRoll = (this.previousDisbursement || 0) + cumulativePreviousDisbursement + (this.dailyDisbursement || 0);
  this.disNo = (this.previousDisbursementRollNo || 0) + cumulativePreviousNumbers + (this.dailyDisNo || 0);
};

// Static method to recalculate disbursement for current day and all subsequent days
disbursementRollSchema.statics.recalculateFromDate = async function(branchId, fromDate) {
  const DisbursementRoll = this;
  
  // Find all disbursement roll entries for this branch from the given date onwards
  const entries = await DisbursementRoll.find({
    branch: branchId,
    date: { $gte: fromDate }
  }).sort({ date: 1 });
  
  // Recalculate each entry in chronological order
  for (const entry of entries) {
    await entry.calculateCumulativeDisbursement();
    await entry.save({ validateBeforeSave: false }); // Skip validation to avoid infinite loop
  }
};

// Index for better query performance
disbursementRollSchema.index({ branch: 1, date: -1 });
disbursementRollSchema.index({ branch: 1, year: -1, month: -1 });

export default mongoose.model('DisbursementRoll', disbursementRollSchema);