import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
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
  predictionDate: {
    type: Date,
    required: true // Date for which prediction is made
  },
  predictionNo: {
    type: Number,
    required: true,
    default: 0
  },
  predictionAmount: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
predictionSchema.index({ branch: 1, predictionDate: -1 });
predictionSchema.index({ branch: 1, date: -1 });

export default mongoose.model('Prediction', predictionSchema);