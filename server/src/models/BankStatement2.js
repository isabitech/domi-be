const mongoose = require('mongoose');

const bankStatement2Schema = new mongoose.Schema({
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
  withd: {
    type: Number,
    default: 0 // From FRM HO field (Cashbook 1)
  },
  tbo: {
    type: Number,
    default: 0 // Transfers between branches (HO editable)
  },
  tboTargetBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch' // Target branch for transfer
  },
  exAmt: {
    type: Number,
    default: 0 // Branch daily expenses (BR editable)
  },
  exPurpose: {
    type: String,
    trim: true // Expense description (BR editable)
  },
  bs2Total: {
    type: Number,
    default: 0 // WITHD + T.B.O + EX AMT
  }
}, {
  timestamps: true
});

// Calculate BS2 total before saving
bankStatement2Schema.pre('save', function(next) {
  this.bs2Total = this.withd + this.tbo + this.exAmt;
  next();
});

// Index for better query performance
bankStatement2Schema.index({ branch: 1, date: -1 });
bankStatement2Schema.index({ user: 1, date: -1 });

module.exports = mongoose.model('BankStatement2', bankStatement2Schema);