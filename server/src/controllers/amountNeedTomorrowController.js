import AmountNeedTomorrow from '../models/AmountNeedTomorrow.js';
import Branch from '../models/Branch.js';
import { 
  amountNeedTomorrowSchema, 
  amountNeedTomorrowDateSchema 
} from '../validators/amountNeedTomorrowValidator.js';

// Create or update amount need tomorrow
const createOrUpdateAmountNeedTomorrow = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = amountNeedTomorrowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { loanAmount, savingsWithdrawalAmount, expensesAmount, notes, date } = value;
    const branchId = req.user.branch;
    const submittedBy = req.user._id;

    // Validate branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Parse date or use today's date
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Check if entry already exists for this date
    const existingEntry = await AmountNeedTomorrow.getForDate(branchId, targetDate);

    let amountNeed;

    if (existingEntry) {
      // Update existing entry
      amountNeed = await AmountNeedTomorrow.findByIdAndUpdate(
        existingEntry._id,
        {
          loanAmount: loanAmount || 0,
          savingsWithdrawalAmount: savingsWithdrawalAmount || 0,
          expensesAmount: expensesAmount || 0,
          notes: notes || '',
          submittedBy
        },
        { new: true, runValidators: true }
      ).populate('submittedBy', 'username email');
    } else {
      // Create new entry
      amountNeed = new AmountNeedTomorrow({
        branch: branchId,
        date: targetDate,
        loanAmount: loanAmount || 0,
        savingsWithdrawalAmount: savingsWithdrawalAmount || 0,
        expensesAmount: expensesAmount || 0,
        notes: notes || '',
        submittedBy
      });

      await amountNeed.save();
      await amountNeed.populate('submittedBy', 'username email');
    }

    res.status(200).json({
      success: true,
      message: existingEntry ? 'Amount need tomorrow updated successfully' : 'Amount need tomorrow created successfully',
      data: amountNeed
    });

  } catch (error) {
    console.error('Error creating/updating amount need tomorrow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save amount need tomorrow',
      error: error.message
    });
  }
};

// Get latest amount need tomorrow for current branch
const getAmountNeedTomorrow = async (req, res) => {
  try {
    const branchId = req.user.branch;
    
    const amountNeed = await AmountNeedTomorrow.getLatestForBranch(branchId);

    if (!amountNeed) {
      // Return default zero values when no data exists
      const defaultData = {
        branch: branchId,
        loanAmount: 0,
        savingsWithdrawalAmount: 0,
        expensesAmount: 0,
        total: 0,
        notes: '',
        date: new Date(),
        submittedBy: null
      };
      
      return res.status(200).json({
        success: true,
        message: 'No amount need tomorrow found, returning defaults',
        data: defaultData
      });
    }

    res.status(200).json({
      success: true,
      data: amountNeed
    });

  } catch (error) {
    console.error('Error fetching amount need tomorrow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amount need tomorrow',
      error: error.message
    });
  }
};

// Get amount need tomorrow for specific date
const getAmountNeedTomorrowByDate = async (req, res) => {
  try {
    // Validate date parameter
    const { error, value } = amountNeedTomorrowDateSchema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { date } = value;
    const branchId = req.user.branch;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const amountNeed = await AmountNeedTomorrow.getForDate(branchId, targetDate);

    if (!amountNeed) {
      // Return default zero values when no data exists for the date
      const defaultData = {
        branch: branchId,
        loanAmount: 0,
        savingsWithdrawalAmount: 0,
        expensesAmount: 0,
        total: 0,
        notes: '',
        date: targetDate,
        submittedBy: null
      };
      
      return res.status(200).json({
        success: true,
        data: defaultData
      });
    }

    res.status(200).json({
      success: true,
      data: amountNeed
    });

  } catch (error) {
    console.error('Error fetching amount need tomorrow by date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amount need tomorrow',
      error: error.message
    });
  }
};

// Get all branches' latest amount need tomorrow (HO access)
const getAllAmountNeedTomorrow = async (req, res) => {
  try {
    // Check if user has HO access
    if (!['HO', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HO privileges required.'
      });
    }

    // Get all branches
    const allBranches = await Branch.find({ isActive: true }, '_id name code').lean();
    
    // Get all existing amount need tomorrow data
    const existingAmounts = await AmountNeedTomorrow.getAllLatest();
    
    // Create a map of existing data by branch ID
    const amountsMap = new Map();
    existingAmounts.forEach(amount => {
      amountsMap.set(amount.branch.toString(), amount);
    });
    
    // Build result array with defaults for branches without data
    const result = allBranches.map(branch => {
      const existingData = amountsMap.get(branch._id.toString());
      
      if (existingData) {
        return existingData;
      } else {
        // Return default values for branches without data
        return {
          branch: branch._id,
          branchName: branch.name,
          branchCode: branch.code,
          loanAmount: 0,
          savingsWithdrawalAmount: 0,
          expensesAmount: 0,
          total: 0,
          notes: '',
          date: null,
          submittedBy: null,
          submittedByUser: null,
          createdAt: null,
          updatedAt: null
        };
      }
    });

    res.status(200).json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error) {
    console.error('Error fetching all amount need tomorrow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all amount need tomorrow',
      error: error.message
    });
  }
};

// Delete amount need tomorrow entry
const deleteAmountNeedTomorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user.branch;

    const amountNeed = await AmountNeedTomorrow.findOne({
      _id: id,
      branch: branchId
    });

    if (!amountNeed) {
      return res.status(404).json({
        success: false,
        message: 'Amount need tomorrow entry not found'
      });
    }

    await AmountNeedTomorrow.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Amount need tomorrow entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting amount need tomorrow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete amount need tomorrow',
      error: error.message
    });
  }
};

// Get amount need tomorrow history for current branch
const getAmountNeedTomorrowHistory = async (req, res) => {
  try {
    const branchId = req.user.branch;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const history = await AmountNeedTomorrow.find({ branch: branchId })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('submittedBy', 'username email')
      .lean();

    const total = await AmountNeedTomorrow.countDocuments({ branch: branchId });

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching amount need tomorrow history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
};

export {
  createOrUpdateAmountNeedTomorrow,
  getAmountNeedTomorrow,
  getAmountNeedTomorrowByDate,
  getAllAmountNeedTomorrow,
  deleteAmountNeedTomorrow,
  getAmountNeedTomorrowHistory
};