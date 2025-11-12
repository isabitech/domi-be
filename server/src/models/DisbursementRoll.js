const mongoose = require('mongoose');

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
  dailyDisbursement: {
    type: Number,
    default: 0 // Sum of DIS AMT from Cashbook 2 for the month
  },
  disbursementRoll: {
    type: Number,
    default: 0 // Previous Disbursement + Daily Disbursement
  }
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

module.exports = mongoose.model('DisbursementRoll', disbursementRollSchema);