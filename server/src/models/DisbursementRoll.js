
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
    default: 0 // HO input
  },
  previousDisbursementRollNo: {
    type: Number,
    default: 0
  },
  dailyDisbursement: {
    type: Number,
    default: 0 // Sum of DIS AMT from Cashbook 2 for the month
  },
  disbursementRoll: {
    type: Number,
    default: 0 // Previous Disbursement + Daily Disbursement
  },
  disNo: {
    type: Number,
    required: true,
    default: 0
  },
}, {
  timestamps: true
});

// Calculate disbursement roll before saving
disbursementRollSchema.pre('save', function(next) {
  this.disbursementRoll = this.previousDisbursement + this.dailyDisbursement;
  next();
});

// Index for better query performance
disbursementRollSchema.index({ branch: 1, year: -1, month: -1 });

export default mongoose.model('DisbursementRoll', disbursementRollSchema);