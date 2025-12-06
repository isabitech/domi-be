import mongoose from 'mongoose';

const dailyOperationsSchema = new mongoose.Schema({
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
  // References to the daily records
  cashbook1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cashbook1'
  },
  cashbook2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cashbook2'
  },
  prediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction'
  },
  bankStatement1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankStatement1'
  },
  bankStatement2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankStatement2'
  },
  loanRegister: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanRegister'
  },
  savingsRegister: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsRegister'
  },
  // Calculated fields
  onlineCIH: {
    type: Number,
    default: 0 // CB TOTAL 1 - CB TOTAL 2
  },
  tso: {
    type: Number,
    default: 0 // Transfer to Senate Office: BS1 - BS2
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  submittedAt: Date
}, {
  timestamps: true
});

// Indexes for query performance and uniqueness
dailyOperationsSchema.index({ branch: 1, date: -1 });
dailyOperationsSchema.index({ user: 1, date: -1 });
dailyOperationsSchema.index({ branch: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyOperations', dailyOperationsSchema);