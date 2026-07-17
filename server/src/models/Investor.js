import mongoose from 'mongoose';

const investorSchema = new mongoose.Schema({
  investorName: {
    type: String,
    required: [true, 'Investor name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  rioDate: {
    type: Date,
    required: [true, 'R.I.O date is required']
  },
  status: {
    type: String,
    enum: ['paid', 'update', 'withdrawal'],
    required: [true, 'Status is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

investorSchema.index({ status: 1, rioDate: -1 });
investorSchema.index({ gender: 1, status: 1 });
investorSchema.index({ phone: 1 });
investorSchema.index({
  investorName: 'text',
  phone: 'text',
  status: 'text'
});

export default mongoose.model('Investor', investorSchema);