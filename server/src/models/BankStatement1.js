import mongoose from 'mongoose';

const bankStatement1Schema = new mongoose.Schema({
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
  opening: {
    type: Number,
    default: 0 // Always starts at 0
  },
  recHO: {
    type: Number,
    default: 0 // From FRM HO (Cashbook 1)
  },
  recBO: {
    type: Number,
    default: 0 // From FRM BR (Cashbook 1)
  },
  domi: {
    type: Number,
    default: 0 // From DOMI BANK (Cashbook 2)
  },
  pa: {
    type: Number,
    default: 0 // From POS/T (Cashbook 2)
  },
  bs1Total: {
    type: Number,
    default: 0 // OPENING + REC HO + REC BO + DOMI + P.A
  }
}, {
  timestamps: true
});

// Calculate BS1 total before saving
bankStatement1Schema.pre('save', function(next) {
  this.bs1Total = this.opening + this.recHO + this.recBO + this.domi + this.pa;
  next();
});

// Index for better query performance
bankStatement1Schema.index({ branch: 1, date: -1 });

export default mongoose.model('BankStatement1', bankStatement1Schema);