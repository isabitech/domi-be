const Cashbook = require('../models/Cashbook');

// @desc    Get all cashbook entries
// @route   GET /api/cashbook
// @access  Private
const getCashbookEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role and filters
    let query = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      query.user = req.user.id;
    } else if (req.user.role === 'manager') {
      query.branch = req.user.branch;
    }
    // Admin can see all entries

    // Apply filters
    if (req.query.type) query.type = req.query.type;
    if (req.query.category) query.category = { $regex: req.query.category, $options: 'i' };
    if (req.query.status) query.status = req.query.status;
    if (req.query.branch) query.branch = req.query.branch;
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
    }

    // Search in description
    if (req.query.search) {
      query.description = { $regex: req.query.search, $options: 'i' };
    }

    const entries = await Cashbook.find(query)
      .populate('user', 'name email')
      .populate('branch', 'name code')
      .populate('approvedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, createdAt: -1 });

    const total = await Cashbook.countDocuments(query);

    // Calculate totals
    const totals = await Cashbook.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          netAmount: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'income'] },
                '$amount',
                { $multiply: ['$amount', -1] }
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      count: entries.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      summary: totals[0] || { totalIncome: 0, totalExpense: 0, netAmount: 0 },
      data: entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single cashbook entry
// @route   GET /api/cashbook/:id
// @access  Private
const getCashbookEntry = async (req, res) => {
  try {
    const entry = await Cashbook.findById(req.params.id)
      .populate('user', 'name email')
      .populate('branch', 'name code')
      .populate('approvedBy', 'name email');
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Cashbook entry not found'
      });
    }

    // Check permissions
    if (req.user.role === 'employee' && entry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this entry'
      });
    }

    if (req.user.role === 'manager' && entry.branch.toString() !== req.user.branch.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this entry'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new cashbook entry
// @route   POST /api/cashbook
// @access  Private
const createCashbookEntry = async (req, res) => {
  try {
    const {
      type,
      category,
      description,
      amount,
      paymentMethod,
      reference,
      date,
      notes
    } = req.body;

    const entry = await Cashbook.create({
      type,
      category,
      description,
      amount,
      paymentMethod,
      reference,
      date: date || Date.now(),
      notes,
      branch: req.user.branch,
      user: req.user.id
    });

    await entry.populate([
      { path: 'user', select: 'name email' },
      { path: 'branch', select: 'name code' }
    ]);

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update cashbook entry
// @route   PUT /api/cashbook/:id
// @access  Private
const updateCashbookEntry = async (req, res) => {
  try {
    let entry = await Cashbook.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Cashbook entry not found'
      });
    }

    // Check permissions - only the creator can edit (and only if not approved)
    if (entry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this entry'
      });
    }

    if (entry.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit approved entries'
      });
    }

    const {
      type,
      category,
      description,
      amount,
      paymentMethod,
      reference,
      date,
      notes
    } = req.body;

    entry = await Cashbook.findByIdAndUpdate(
      req.params.id,
      {
        type,
        category,
        description,
        amount,
        paymentMethod,
        reference,
        date,
        notes,
        status: 'pending' // Reset to pending if it was rejected
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'user', select: 'name email' },
      { path: 'branch', select: 'name code' }
    ]);

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete cashbook entry
// @route   DELETE /api/cashbook/:id
// @access  Private
const deleteCashbookEntry = async (req, res) => {
  try {
    const entry = await Cashbook.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Cashbook entry not found'
      });
    }

    // Check permissions
    const canDelete = 
      req.user.role === 'admin' ||
      (req.user.role === 'manager' && entry.branch.toString() === req.user.branch.toString()) ||
      (entry.user.toString() === req.user.id && entry.status === 'pending');

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this entry'
      });
    }

    await Cashbook.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve/Reject cashbook entry
// @route   PATCH /api/cashbook/:id/status
// @access  Private (Manager/Admin only)
const updateEntryStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const entry = await Cashbook.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Cashbook entry not found'
      });
    }

    // Check permissions
    const canApprove = 
      req.user.role === 'admin' ||
      (req.user.role === 'manager' && entry.branch.toString() === req.user.branch.toString());

    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve/reject this entry'
      });
    }

    entry.status = status;
    entry.approvedBy = req.user.id;
    entry.approvedAt = Date.now();
    if (notes) entry.notes = notes;

    await entry.save();

    await entry.populate([
      { path: 'user', select: 'name email' },
      { path: 'branch', select: 'name code' },
      { path: 'approvedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: `Entry ${status} successfully`,
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get cashbook summary/reports
// @route   GET /api/cashbook/reports/summary
// @access  Private
const getCashbookSummary = async (req, res) => {
  try {
    let query = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      query.user = req.user.id;
    } else if (req.user.role === 'manager') {
      query.branch = req.user.branch;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
    }

    if (req.query.branch) query.branch = req.query.branch;

    const summary = await Cashbook.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          pendingEntries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approvedEntries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          rejectedEntries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Category-wise breakdown
    const categoryBreakdown = await Cashbook.aggregate([
      { $match: query },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.type': 1, total: -1 } }
    ]);

    res.json({
      success: true,
      summary: summary[0] || {
        totalIncome: 0,
        totalExpense: 0,
        pendingEntries: 0,
        approvedEntries: 0,
        rejectedEntries: 0
      },
      categoryBreakdown,
      netAmount: (summary[0]?.totalIncome || 0) - (summary[0]?.totalExpense || 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCashbookEntries,
  getCashbookEntry,
  createCashbookEntry,
  updateCashbookEntry,
  deleteCashbookEntry,
  updateEntryStatus,
  getCashbookSummary
};