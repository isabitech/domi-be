/**
 * EFCC (Expected Financial Compliance Calculation) Model
 * 
 * Formula: currentAmountOwing = previousAmountOwing + todayRemittance - amtRemittingNow
 * 
 * First Day Logic:
 * currentAmountOwing = previousAmountOwing(BR input) + todayRemittance(BR input) - amtRemittingNow(BR input)
 * 
 * Concurrent Days Logic:
 * currentAmountOwing = allPreviousAmountOwing + todayRemittance(default 0) - amtRemittingNow(BR input)
 */

import mongoose from 'mongoose';

const efccSchema = new mongoose.Schema({
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
  previousAmountOwing: {
    type: Number,
    default: 0,
    required: true
  },
  todayRemittance: {
    type: Number,
    default: 0,
    required: true
  },
  amtRemittingNow: {
    type: Number,
    default: 0,
    required: true
  },
  currentAmountOwing: {
    type: Number,
    default: 0,
    required: true
  },
  submittedAt: {
    type: Date,
    default: null
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isSubmitted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate current amount owing before saving
efccSchema.pre('save', async function(next) {
  await this.calculateCurrentAmountOwing();
  next();
});

// Calculate current amount owing using cumulative logic
efccSchema.methods.calculateCurrentAmountOwing = async function() {
  const EFCC = this.constructor;
  
  // Get all previous EFCC records for this branch before current date
  const previousRecords = await EFCC.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 });

  // For the first record, or when previousAmountOwing is manually set, use the provided value
  if (previousRecords.length === 0 || this.previousAmountOwing !== 0) {
    // First day logic or manual override: currentAmountOwing = previousAmountOwing + todayRemittance - amtRemittingNow
    this.currentAmountOwing = (this.previousAmountOwing || 0) + (this.todayRemittance || 0) - (this.amtRemittingNow || 0);
  } else {
    // Concurrent days logic: currentAmountOwing = allPreviousCurrentAmountOwing + todayRemittance - amtRemittingNow
    const latestPreviousRecord = previousRecords[previousRecords.length - 1];
    const allPreviousAmountOwing = latestPreviousRecord.currentAmountOwing || 0;
    
    this.currentAmountOwing = allPreviousAmountOwing + (this.todayRemittance || 0) - (this.amtRemittingNow || 0);
    
    // Set previousAmountOwing to the latest previous record's currentAmountOwing for reference
    this.previousAmountOwing = allPreviousAmountOwing;
  }
};

// Static method to recalculate all EFCC records after a specific date
efccSchema.statics.recalculateFromDate = async function(branchId, fromDate = null) {
  const query = { branch: branchId };
  if (fromDate) {
    query.date = { $gte: fromDate };
  }

  const records = await this.find(query).sort({ date: 1 });
  
  for (const record of records) {
    await record.calculateCurrentAmountOwing();
    await record.save({ validateBeforeSave: false });
  }
  
  return { updated: records.length };
};

// Get latest EFCC record for a branch
efccSchema.statics.getLatestForBranch = async function(branchId) {
  return await this.findOne({ branch: branchId }).sort({ date: -1 });
};

// Create or update today's EFCC record
efccSchema.statics.upsertToday = async function(branchId, data, userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  let record = await this.findOne({
    branch: branchId,
    date: { $gte: startOfDay, $lt: endOfDay }
  });
  
  if (!record) {
    record = new this({
      branch: branchId,
      date: startOfDay,
      ...data,
      submittedBy: userId
    });
  } else {
    // Update existing record
    Object.assign(record, data);
    record.submittedBy = userId;
  }
  
  await record.save();
  
  // Trigger recalculation for subsequent records
  await this.recalculateFromDate(branchId, startOfDay);
  
  return record;
};

// Submit today's EFCC record
efccSchema.methods.submit = async function(userId) {
  this.isSubmitted = true;
  this.submittedAt = new Date();
  this.submittedBy = userId;
  await this.save();
  return this;
};

// Index for better query performance
efccSchema.index({ branch: 1, date: -1 });
efccSchema.index({ date: -1 });
efccSchema.index({ isSubmitted: 1 });

export default mongoose.model('EFCC', efccSchema);