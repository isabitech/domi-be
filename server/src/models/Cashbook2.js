
/**
 * PRD Formula: Cashbook 2
 * cbTotal2 = disAmt + savWith + domiBank + posT
 * - disNo, disAmt, disWithInt, savWith, domiBank, posT: BR input (daily)
 * Permissions:
 *   - BR can input: disNo, disAmt, disWithInt, savWith, domiBank, posT
 *   - cbTotal2: system calculated, viewable by both HO and BR
 */
import mongoose from 'mongoose';

const cashbook2Schema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // BR editable fields
  disNo: {
    type: Number,
    required: true,
    default: 0
  },
  disAmt: {
    type: Number,
    required: true,
    default: 0
  },
  disWithInt: {
    type: Number,
    required: true,
    default: 0
  },
  savWith: {
    type: Number,
    required: true,
    default: 0
  },
  domiBank: {
    type: Number,
    required: true,
    default: 0
  },
  posT: {
    type: Number,
    required: true,
    default: 0
  },
  // System calculated
  cbTotal2: {
    type: Number,
    default: 0
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  submittedAt: Date
}, {
  timestamps: true
});

// Calculate totals before saving
cashbook2Schema.pre('save', function(next) {
  // CB TOTAL 2 = DIS AMT + SAV WITH + DOMI BANK + POS/T
  this.cbTotal2 = this.disAmt + this.savWith + this.domiBank + this.posT;
  next();
});

// Index for better query performance
cashbook2Schema.index({ branch: 1, date: -1 });
cashbook2Schema.index({ user: 1, date: -1 });

export default mongoose.model('Cashbook2', cashbook2Schema);