import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Branch code is required'],
    unique: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  managerEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  managerPassword: {
    type: String
  },
  operationHours: {
    type: String
  },
  dailyLimit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active','inactive'],
    default: 'active'
  },
  // PRD specific fields for branch operations
  previousLoanTotal: {
    type: Number,
    default: 0
  },
  previousSavingsTotal: {
    type: Number,
    default: 0
  },
  previousDisbursement: {
    type: Number,
    default: 0
  },
  loanMultiplier: {
    type: Number,
    default: 1 // HO configurable factor for loan register computation
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Branch', branchSchema);