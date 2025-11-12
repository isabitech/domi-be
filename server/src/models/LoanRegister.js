const mongoose = require('mongoose');

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
    default: 0 // Calculated: (Previous total * HO rate) + Disbursement - Collection
  }
}, {
  timestamps: true
});

// Calculate current loan balance before saving
loanRegisterSchema.pre('save', function(next) {
  this.currentLoanBalance = this.previousLoanTotal + this.loanDisbursementWithInterest - this.loanCollection;
  next();
});

// Index for better query performance
loanRegisterSchema.index({ branch: 1, date: -1 });

module.exports = mongoose.model('LoanRegister', loanRegisterSchema);