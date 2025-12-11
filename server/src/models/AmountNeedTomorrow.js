import mongoose from 'mongoose';

const amountNeedTomorrowSchema = new mongoose.Schema({
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
  loanAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  savingsWithdrawalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  expensesAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate total before saving
amountNeedTomorrowSchema.pre('save', function(next) {
  this.total = (this.loanAmount || 0) + (this.savingsWithdrawalAmount || 0) + (this.expensesAmount || 0);
  next();
});

// Indexes for better query performance
amountNeedTomorrowSchema.index({ branch: 1, date: -1 });
amountNeedTomorrowSchema.index({ branch: 1, createdAt: -1 });

// Virtual for formatted date
amountNeedTomorrowSchema.virtual('formattedDate').get(function() {
  return this.date ? this.date.toLocaleDateString('en-GB') : null;
});

// Static method to get latest for a branch
amountNeedTomorrowSchema.statics.getLatestForBranch = function(branchId) {
  return this.findOne({ branch: branchId })
    .sort({ date: -1, createdAt: -1 })
    .populate('submittedBy', 'username email')
    .lean();
};

// Static method to get for specific date
amountNeedTomorrowSchema.statics.getForDate = function(branchId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.findOne({
    branch: branchId,
    date: { $gte: startOfDay, $lte: endOfDay }
  })
  .sort({ createdAt: -1 })
  .populate('submittedBy', 'username email')
  .lean();
};

// Static method to get all branches' latest amounts
amountNeedTomorrowSchema.statics.getAllLatest = async function() {
  const pipeline = [
    {
      $sort: { branch: 1, date: -1, createdAt: -1 }
    },
    {
      $group: {
        _id: '$branch',
        latest: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$latest' }
    },
    {
      $lookup: {
        from: 'branches',
        localField: 'branch',
        foreignField: '_id',
        as: 'branchInfo'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'submittedBy',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $addFields: {
        branchName: { $arrayElemAt: ['$branchInfo.name', 0] },
        branchCode: { $arrayElemAt: ['$branchInfo.code', 0] },
        submittedByUser: {
          username: { $arrayElemAt: ['$userInfo.username', 0] },
          email: { $arrayElemAt: ['$userInfo.email', 0] }
        }
      }
    },
    {
      $project: {
        branchInfo: 0,
        userInfo: 0
      }
    },
    {
      $sort: { branchName: 1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

export default mongoose.model('AmountNeedTomorrow', amountNeedTomorrowSchema);