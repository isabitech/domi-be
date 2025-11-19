
/**
 * PRD Formula: Cashbook 1
 * total = savings + loanCollection + chargesCollection
 * cbTotal1 = pcih + savings + loanCollection + chargesCollection + frmHO + frmBR
 * - pcih, savings, loanCollection, chargesCollection: BR input (daily)
 * - frmHO, frmBR: HO input (editable only by HO)
 * Permissions:
 *   - BR can input: pcih, savings, loanCollection, chargesCollection
 *   - HO can input: frmHO, frmBR
 *   - total, cbTotal1: system calculated, viewable by both HO and BR
 */
import mongoose from 'mongoose';

const cashbook1Schema = new mongoose.Schema({
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
  pcih: {
    type: Number,
    required: true,
    default: 0
  },
  savings: {
    type: Number,
    required: true,
    default: 0
  },
  loanCollection: {
    type: Number,
    required: true,
    default: 0
  },
  chargesCollection: {
    type: Number,
    required: true,
    default: 0
  },
  // System calculated
  total: {
    type: Number,
    default: 0
  },
  // HO editable fields
  frmHO: {
    type: Number,
    default: 0
  },
  frmBR: {
    type: Number,
    default: 0
  },
  // System calculated
  cbTotal1: {
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
cashbook1Schema.pre('save', function(next) {
  // Total = Savings + Loan Collection + Charges
  this.total = this.savings + this.loanCollection + this.chargesCollection;
  
  // CB TOTAL 1 = PCIH + Savings + Loan + Charges + FRM HO + FRM BR
  this.cbTotal1 = this.pcih + this.savings + this.loanCollection + this.chargesCollection + this.frmHO + this.frmBR;
  
  next();
});

// Index for better query performance
cashbook1Schema.index({ branch: 1, date: -1 });
cashbook1Schema.index({ user: 1, date: -1 });

export default mongoose.model('Cashbook1', cashbook1Schema);