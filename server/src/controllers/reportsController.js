const DailyOperations = require('../models/DailyOperations');
const Cashbook1 = require('../models/Cashbook1');
const Cashbook2 = require('../models/Cashbook2');
const LoanRegister = require('../models/LoanRegister');
const SavingsRegister = require('../models/SavingsRegister');
const DisbursementRoll = require('../models/DisbursementRoll');
const Branch = require('../models/Branch');

// @desc    Generate Daily Branch Report
// @route   GET /api/reports/daily
// @access  Private
const getDailyReport = async (req, res) => {
  try {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Set date range for the day
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    let query = { 
      date: { $gte: startOfDay, $lt: endOfDay }
    };

    // Role-based filtering
    if (req.user.role === 'BR') {
      query.branch = req.user.branch;
    } else if (branchId) {
      query.branch = branchId;
    }

    const operations = await DailyOperations.find(query)
      .populate([
        { path: 'branch', select: 'name code' },
        { path: 'user', select: 'name email' },
        { path: 'cashbook1' },
        { path: 'cashbook2' },
        { path: 'prediction' },
        { path: 'bankStatement1' },
        { path: 'bankStatement2' },
        { path: 'loanRegister' },
        { path: 'savingsRegister' }
      ])
      .sort({ branch: 1 });

    const reportData = {
      reportDate: targetDate,
      generatedAt: new Date(),
      generatedBy: req.user.name,
      operations: operations.map(op => ({
        branch: {
          name: op.branch.name,
          code: op.branch.code
        },
        user: {
          name: op.user.name,
          email: op.user.email
        },
        cashbook1: {
          pcih: op.cashbook1?.pcih || 0,
          savings: op.cashbook1?.savings || 0,
          loanCollection: op.cashbook1?.loanCollection || 0,
          chargesCollection: op.cashbook1?.chargesCollection || 0,
          total: op.cashbook1?.total || 0,
          frmHO: op.cashbook1?.frmHO || 0,
          frmBR: op.cashbook1?.frmBR || 0,
          cbTotal1: op.cashbook1?.cbTotal1 || 0
        },
        cashbook2: {
          disNo: op.cashbook2?.disNo || 0,
          disAmt: op.cashbook2?.disAmt || 0,
          disWithInt: op.cashbook2?.disWithInt || 0,
          savWith: op.cashbook2?.savWith || 0,
          domiBank: op.cashbook2?.domiBank || 0,
          posT: op.cashbook2?.posT || 0,
          cbTotal2: op.cashbook2?.cbTotal2 || 0
        },
        prediction: {
          predictionNo: op.prediction?.predictionNo || 0,
          predictionAmount: op.prediction?.predictionAmount || 0
        },
        bankStatements: {
          bs1Total: op.bankStatement1?.bs1Total || 0,
          bs2Total: op.bankStatement2?.bs2Total || 0
        },
        registers: {
          currentLoanBalance: op.loanRegister?.currentLoanBalance || 0,
          currentSavings: op.savingsRegister?.currentSavings || 0
        },
        calculated: {
          onlineCIH: op.onlineCIH,
          tso: op.tso
        },
        status: {
          isCompleted: op.isCompleted,
          submittedAt: op.submittedAt
        }
      }))
    };

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate Monthly Summary Report
// @route   GET /api/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, branchId } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Set date range for the month
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    let query = { 
      date: { $gte: startOfMonth, $lte: endOfMonth }
    };

    // Role-based filtering
    if (req.user.role === 'BR') {
      query.branch = req.user.branch;
    } else if (branchId) {
      query.branch = branchId;
    }

    // Get monthly summary
    const monthlySummary = await DailyOperations.aggregate([
      { $match: query },
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
          from: 'cashbook1s',
          localField: 'cashbook1',
          foreignField: '_id',
          as: 'cb1'
        }
      },
      {
        $lookup: {
          from: 'cashbook2s',
          localField: 'cashbook2',
          foreignField: '_id',
          as: 'cb2'
        }
      },
      { $unwind: '$branchInfo' },
      { $unwind: '$cb1' },
      { $unwind: '$cb2' },
      {
        $group: {
          _id: '$branch',
          branchName: { $first: '$branchInfo.name' },
          branchCode: { $first: '$branchInfo.code' },
          totalSavings: { $sum: '$cb1.savings' },
          totalLoanCollection: { $sum: '$cb1.loanCollection' },
          totalCharges: { $sum: '$cb1.chargesCollection' },
          totalDisbursements: { $sum: '$cb2.disAmt' },
          totalWithdrawals: { $sum: '$cb2.savWith' },
          totalTSO: { $sum: '$tso' },
          operatingDays: { $sum: 1 },
          avgOnlineCIH: { $avg: '$onlineCIH' }
        }
      }
    ]);

    // Get disbursement roll for the month
    const disbursementRolls = await DisbursementRoll.find({
      month: targetMonth,
      year: targetYear,
      ...(req.user.role === 'BR' ? { branch: req.user.branch } : {}),
      ...(branchId ? { branch: branchId } : {})
    }).populate('branch', 'name code');

    // Get loan and savings movement
    const registerMovement = await DailyOperations.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'loanregisters',
          localField: 'loanRegister',
          foreignField: '_id',
          as: 'loanReg'
        }
      },
      {
        $lookup: {
          from: 'savingsregisters',
          localField: 'savingsRegister',
          foreignField: '_id',
          as: 'savReg'
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      { $unwind: '$branchInfo' },
      { $unwind: '$loanReg' },
      { $unwind: '$savReg' },
      {
        $group: {
          _id: '$branch',
          branchName: { $first: '$branchInfo.name' },
          openingLoanBalance: { $first: '$loanReg.previousLoanTotal' },
          closingLoanBalance: { $last: '$loanReg.currentLoanBalance' },
          openingSavingsBalance: { $first: '$savReg.previousSavingsTotal' },
          closingSavingsBalance: { $last: '$savReg.currentSavings' }
        }
      }
    ]);

    const reportData = {
      month: targetMonth,
      year: targetYear,
      generatedAt: new Date(),
      generatedBy: req.user.name,
      monthlySummary,
      disbursementRolls,
      registerMovement
    };

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate HO Consolidated Report
// @route   GET /api/reports/consolidated
// @access  Private (HO only)
const getConsolidatedReport = async (req, res) => {
  try {
    if (req.user.role !== 'HO') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Head Office users only.'
      });
    }

    const { startDate, endDate } = req.query;
    const today = new Date();
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { 
        date: { 
          $gte: new Date(startDate), 
          $lte: new Date(endDate) 
        }
      };
    } else {
      // Default to current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    // Get all branches consolidated data
    const consolidatedData = await DailyOperations.aggregate([
      { $match: dateFilter },
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
          from: 'cashbook1s',
          localField: 'cashbook1',
          foreignField: '_id',
          as: 'cb1'
        }
      },
      {
        $lookup: {
          from: 'cashbook2s',
          localField: 'cashbook2',
          foreignField: '_id',
          as: 'cb2'
        }
      },
      { $unwind: '$branchInfo' },
      { $unwind: '$cb1' },
      { $unwind: '$cb2' },
      {
        $group: {
          _id: '$branch',
          branchName: { $first: '$branchInfo.name' },
          branchCode: { $first: '$branchInfo.code' },
          totalSavings: { $sum: '$cb1.savings' },
          totalLoanCollection: { $sum: '$cb1.loanCollection' },
          totalCharges: { $sum: '$cb1.chargesCollection' },
          totalDisbursements: { $sum: '$cb2.disAmt' },
          totalWithdrawals: { $sum: '$cb2.savWith' },
          totalTSO: { $sum: '$tso' },
          avgOnlineCIH: { $avg: '$onlineCIH' },
          operatingDays: { $sum: 1 },
          lastOperationDate: { $max: '$date' }
        }
      },
      { $sort: { totalSavings: -1 } }
    ]);

    // Get grand totals
    const grandTotals = await DailyOperations.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'cashbook1s',
          localField: 'cashbook1',
          foreignField: '_id',
          as: 'cb1'
        }
      },
      {
        $lookup: {
          from: 'cashbook2s',
          localField: 'cashbook2',
          foreignField: '_id',
          as: 'cb2'
        }
      },
      { $unwind: '$cb1' },
      { $unwind: '$cb2' },
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$cb1.savings' },
          totalLoanCollection: { $sum: '$cb1.loanCollection' },
          totalCharges: { $sum: '$cb1.chargesCollection' },
          totalDisbursements: { $sum: '$cb2.disAmt' },
          totalWithdrawals: { $sum: '$cb2.savWith' },
          totalTSO: { $sum: '$tso' },
          totalOnlineCIH: { $sum: '$onlineCIH' },
          activeBranches: { $addToSet: '$branch' },
          totalOperations: { $sum: 1 }
        }
      }
    ]);

    // Get current register balances for all branches
    const currentRegisters = await Branch.aggregate([
      {
        $lookup: {
          from: 'loanregisters',
          let: { branchId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$branch', '$$branchId'] } } },
            { $sort: { date: -1 } },
            { $limit: 1 }
          ],
          as: 'latestLoanRegister'
        }
      },
      {
        $lookup: {
          from: 'savingsregisters',
          let: { branchId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$branch', '$$branchId'] } } },
            { $sort: { date: -1 } },
            { $limit: 1 }
          ],
          as: 'latestSavingsRegister'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          currentLoanBalance: { 
            $ifNull: [{ $arrayElemAt: ['$latestLoanRegister.currentLoanBalance', 0] }, 0] 
          },
          currentSavingsBalance: { 
            $ifNull: [{ $arrayElemAt: ['$latestSavingsRegister.currentSavings', 0] }, 0] 
          }
        }
      }
    ]);

    const reportData = {
      period: {
        startDate: startDate || new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0)
      },
      generatedAt: new Date(),
      generatedBy: req.user.name,
      consolidatedData,
      grandTotals: grandTotals[0] || {
        totalSavings: 0,
        totalLoanCollection: 0,
        totalCharges: 0,
        totalDisbursements: 0,
        totalWithdrawals: 0,
        totalTSO: 0,
        totalOnlineCIH: 0,
        activeBranches: [],
        totalOperations: 0
      },
      currentRegisters
    };

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate Custom Report
// @route   GET /api/reports/custom
// @access  Private
const getCustomReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      branchIds, 
      reportType, // 'summary', 'detailed', 'trends'
      groupBy // 'day', 'week', 'month'
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    let query = { 
      date: { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      }
    };

    // Role-based filtering
    if (req.user.role === 'BR') {
      query.branch = req.user.branch;
    } else if (branchIds) {
      const branchArray = Array.isArray(branchIds) ? branchIds : branchIds.split(',');
      query.branch = { $in: branchArray };
    }

    let aggregationPipeline = [
      { $match: query },
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
          from: 'cashbook1s',
          localField: 'cashbook1',
          foreignField: '_id',
          as: 'cb1'
        }
      },
      {
        $lookup: {
          from: 'cashbook2s',
          localField: 'cashbook2',
          foreignField: '_id',
          as: 'cb2'
        }
      },
      { $unwind: '$branchInfo' },
      { $unwind: '$cb1' },
      { $unwind: '$cb2' }
    ];

    // Add grouping based on groupBy parameter
    let grouping = {};
    if (groupBy === 'day') {
      grouping = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
        branch: '$branch'
      };
    } else if (groupBy === 'week') {
      grouping = {
        year: { $year: '$date' },
        week: { $week: '$date' },
        branch: '$branch'
      };
    } else if (groupBy === 'month') {
      grouping = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        branch: '$branch'
      };
    } else {
      // Default grouping by branch only
      grouping = { branch: '$branch' };
    }

    aggregationPipeline.push({
      $group: {
        _id: grouping,
        branchName: { $first: '$branchInfo.name' },
        branchCode: { $first: '$branchInfo.code' },
        period: { $first: '$date' },
        totalSavings: { $sum: '$cb1.savings' },
        totalLoanCollection: { $sum: '$cb1.loanCollection' },
        totalCharges: { $sum: '$cb1.chargesCollection' },
        totalDisbursements: { $sum: '$cb2.disAmt' },
        totalWithdrawals: { $sum: '$cb2.savWith' },
        avgOnlineCIH: { $avg: '$onlineCIH' },
        totalTSO: { $sum: '$tso' },
        operationCount: { $sum: 1 }
      }
    });

    aggregationPipeline.push({ $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } });

    const reportData = await DailyOperations.aggregate(aggregationPipeline);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        reportType: reportType || 'summary',
        groupBy: groupBy || 'branch',
        generatedAt: new Date(),
        generatedBy: req.user.name,
        results: reportData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getConsolidatedReport,
  getCustomReport
};