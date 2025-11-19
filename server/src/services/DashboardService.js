import DailyOperations from '../models/DailyOperations.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';

class DashboardService {
  static async branchDashboard(req) {
    const { startDate, endDate } = req.query;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { date: { $gte: thirtyDaysAgo, $lte: today } };
    }

    const query = { branch: req.user.branch, ...dateFilter };

    const todayOperations = await DailyOperations.findOne({
      branch: req.user.branch,
      date: { $gte: startOfToday, $lt: endOfToday }
    }).populate(['cashbook1', 'cashbook2', 'loanRegister', 'savingsRegister']);

    const summaryStats = await DailyOperations.aggregate([
      { $match: query },
      { $lookup: { from: 'cashbook1s', localField: 'cashbook1', foreignField: '_id', as: 'cb1' } },
      { $lookup: { from: 'cashbook2s', localField: 'cashbook2', foreignField: '_id', as: 'cb2' } },
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
            avgOnlineCIH: { $avg: '$onlineCIH' },
            totalTSO: { $sum: '$tso' },
            operationDays: { $sum: 1 }
        }
      }
    ]);

    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trendDataRaw = await DailyOperations.find({
      branch: req.user.branch,
      date: { $gte: sevenDaysAgo, $lte: today }
    }).populate(['cashbook1', 'cashbook2']).sort({ date: 1 });

    const currentLoanRegister = await LoanRegister.findOne({ branch: req.user.branch }).sort({ date: -1 });
    const currentSavingsRegister = await SavingsRegister.findOne({ branch: req.user.branch }).sort({ date: -1 });

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const disbursementRoll = await DisbursementRoll.findOne({
      branch: req.user.branch,
      month: currentMonth,
      year: currentYear
    });

    return {
      todayOperations,
      summary: summaryStats[0] || {
        totalSavings: 0,
        totalLoanCollection: 0,
        totalCharges: 0,
        totalDisbursements: 0,
        totalWithdrawals: 0,
        avgOnlineCIH: 0,
        totalTSO: 0,
        operationDays: 0
      },
      trendData: trendDataRaw.map(op => ({
        date: op.date,
        savings: op.cashbook1?.savings || 0,
        disbursements: op.cashbook2?.disAmt || 0,
        onlineCIH: op.onlineCIH,
        tso: op.tso
      })),
      currentRegisters: {
        loanBalance: currentLoanRegister?.currentLoanBalance || 0,
        savingsBalance: currentSavingsRegister?.currentSavings || 0,
        monthlyDisbursement: disbursementRoll?.disbursementRoll || 0
      }
    };
  }

  static async hoDashboard(req) {
    const { startDate, endDate, branchId } = req.query;
    const today = new Date();

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { date: { $gte: thirtyDaysAgo, $lte: today } };
    }

    let query = { ...dateFilter };
    if (branchId) query.branch = branchId;

    const branches = await Branch.find({ isActive: true }).select('name code').sort({ name: 1 });

    const consolidatedSummary = await DailyOperations.aggregate([
      { $match: query },
      { $lookup: { from: 'cashbook1s', localField: 'cashbook1', foreignField: '_id', as: 'cb1' } },
      { $lookup: { from: 'cashbook2s', localField: 'cashbook2', foreignField: '_id', as: 'cb2' } },
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
          totalOnlineCIH: { $sum: '$onlineCIH' },
          totalTSO: { $sum: '$tso' },
          activeBranches: { $addToSet: '$branch' },
          totalOperations: { $sum: 1 }
        }
      }
    ]);

    const branchPerformance = await DailyOperations.aggregate([
      { $match: query },
      { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
      { $lookup: { from: 'cashbook1s', localField: 'cashbook1', foreignField: '_id', as: 'cb1' } },
      { $lookup: { from: 'cashbook2s', localField: 'cashbook2', foreignField: '_id', as: 'cb2' } },
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
          totalDisbursements: { $sum: '$cb2.disAmt' },
          avgOnlineCIH: { $avg: '$onlineCIH' },
          totalTSO: { $sum: '$tso' },
          operationDays: { $sum: 1 },
          lastOperation: { $max: '$date' }
        }
      },
      { $sort: { totalSavings: -1 } }
    ]);

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const todayStatus = await DailyOperations.aggregate([
      { $match: { date: { $gte: startOfToday, $lt: endOfToday } } },
      { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
      { $unwind: '$branchInfo' },
      { $project: { branchName: '$branchInfo.name', branchCode: '$branchInfo.code', isCompleted: 1, submittedAt: 1, onlineCIH: 1, tso: 1 } }
    ]);

    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trendData = await DailyOperations.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo, $lte: today } } },
      { $lookup: { from: 'cashbook1s', localField: 'cashbook1', foreignField: '_id', as: 'cb1' } },
      { $lookup: { from: 'cashbook2s', localField: 'cashbook2', foreignField: '_id', as: 'cb2' } },
      { $unwind: '$cb1' },
      { $unwind: '$cb2' },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } }, date: { $first: '$date' }, totalSavings: { $sum: '$cb1.savings' }, totalDisbursements: { $sum: '$cb2.disAmt' }, totalTSO: { $sum: '$tso' }, operatingBranches: { $sum: 1 } } },
      { $sort: { date: 1 } }
    ]);

    return {
      branches,
      consolidatedSummary: consolidatedSummary[0] || {
        totalSavings: 0,
        totalLoanCollection: 0,
        totalCharges: 0,
        totalDisbursements: 0,
        totalWithdrawals: 0,
        totalOnlineCIH: 0,
        totalTSO: 0,
        activeBranches: [],
        totalOperations: 0
      },
      branchPerformance,
      todayStatus,
      trendData: trendData.map(item => ({
        date: item.date,
        totalSavings: item.totalSavings,
        totalDisbursements: item.totalDisbursements,
        totalTSO: item.totalTSO,
        operatingBranches: item.operatingBranches
      }))
    };
  }
}

export default DashboardService;
