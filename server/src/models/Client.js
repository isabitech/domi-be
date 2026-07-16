import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  union: {
    type: String,
    required: [true, 'Union is required'],
    trim: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientPhone: {
    type: String,
    required: [true, 'Client phone is required'],
    trim: true
  },
  clientNickName: {
    type: String,
    trim: true,
    default: ''
  },
  guarantorName: {
    type: String,
    required: [true, 'Guarantor name is required'],
    trim: true
  },
  guarantorPhone: {
    type: String,
    required: [true, 'Guarantor phone is required'],
    trim: true
  },
  guarantorNickName: {
    type: String,
    trim: true,
    default: ''
  },
  partnerReferrerName: {
    type: String,
    required: [true, 'Partner/Referrer name is required'],
    trim: true
  },
  partnerReferrerPhone: {
    type: String,
    required: [true, 'Partner/Referrer phone is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
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

clientSchema.index({ branch: 1, createdAt: -1 });
clientSchema.index({ branch: 1, status: 1 });
clientSchema.index({ branch: 1, clientPhone: 1 });
clientSchema.index({
  union: 'text',
  clientName: 'text',
  clientPhone: 'text',
  clientNickName: 'text',
  guarantorName: 'text',
  guarantorPhone: 'text',
  guarantorNickName: 'text',
  partnerReferrerName: 'text',
  partnerReferrerPhone: 'text'
});

export default mongoose.model('Client', clientSchema);
