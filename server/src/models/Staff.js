import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  staffName: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true
  },
  staffIdNumber: {
    type: String,
    required: [true, 'Staff ID number is required'],
    unique: true,
    trim: true
  },
  employmentDate: {
    type: Date,
    required: [true, 'Employment date is required']
  },
  currentPosition: {
    type: String,
    required: [true, 'Current position is required'],
    trim: true
  },
  currentBranch: {
    type: String,
    required: [true, 'Current branch is required'],
    trim: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  residentialAddress: {
    type: String,
    required: [true, 'Residential address is required'],
    trim: true
  },
  guarantorName: {
    type: String,
    required: [true, 'Guarantor name is required'],
    trim: true
  },
  guarantorNumber: {
    type: String,
    required: [true, 'Guarantor number is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
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

staffSchema.index({ branch: 1, employmentDate: -1 });
staffSchema.index({ branch: 1, gender: 1 });
staffSchema.index({
  staffName: 'text',
  staffIdNumber: 'text',
  currentPosition: 'text',
  currentBranch: 'text',
  guarantorName: 'text',
  guarantorNumber: 'text'
});

export default mongoose.model('Staff', staffSchema);
