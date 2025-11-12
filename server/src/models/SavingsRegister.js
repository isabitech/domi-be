const mongoose = require('mongoose');

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

// Calculate current savings before saving
savingsRegisterSchema.pre('save', function(next) {
  this.currentSavings = this.savings + this.previousSavingsTotal - this.savingsWithdrawal;
  next();
});

// Index for better query performance
savingsRegisterSchema.index({ branch: 1, date: -1 });

module.exports = mongoose.model('SavingsRegister', savingsRegisterSchema);