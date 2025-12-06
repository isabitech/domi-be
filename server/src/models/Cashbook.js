import mongoose from 'mongoose';

const cashbookSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'card', 'online'],
    default: 'cash'
  },
  reference: {
    type: String,
    trim: true
  },
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Index for better query performance
cashbookSchema.index({ branch: 1, date: -1 });
cashbookSchema.index({ user: 1, date: -1 });
cashbookSchema.index({ type: 1, status: 1 });

export default mongoose.model('Cashbook', cashbookSchema);