import mongoose from 'mongoose';
import DailyOperations from '../models/DailyOperations.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';

class DashboardService {
  // Corrected branchDashboard
  static async branchDashboard(req, branchId) {
    const { startDate, endDate } = req.query;
    const today = new Date();

    // Date range filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { date: { $gte: thirtyDaysAgo, $lte: today } };
    }

    const resolvedBranchId = branchId?._id || branchId;
    const branchObjectId = resolvedBranchId
      ? resolvedBranchId instanceof mongoose.Types.ObjectId
        ? resolvedBranchId
        : new mongoose.Types.ObjectId(resolvedBranchId)
      : null;

    // Aggregated daily operations for branch
    const dailyOps = await DailyOperations.aggregate([
      { $match: { branch: branchObjectId, ...dateFilter } },
      {
        $lookup: {
          from: 'cashbooks',
          localField: 'cashbook1',
          foreignField: '_id',
          as: 'cashbook1'
        }
      },
      { $unwind: { path: '$cashbook1', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'cashbooks',
          localField: 'cashbook2',
          foreignField: '_id',
          as: 'cashbook2'
        }
      },
      { $unwind: { path: '$cashbook2', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$cashbook1.savings' },
          totalLoanCollection: { $sum: '$cashbook1.loanCollection' },
          totalCharges: { $sum: '$cashbook1.chargesCollection' },
          totalDisbursements: { $sum: '$cashbook2.disAmt' },
          totalWithdrawals: { $sum: '$cashbook2.savWith' },
          totalTSO: { $sum: '$tso' },
          totalOnlineCIH: { $sum: '$onlineCIH' },
          operationDays: { $sum: 1 }
        }
      }
    ]);

    const summary = dailyOps[0] || {
      totalSavings: 0,
      totalLoanCollection: 0,
      totalCharges: 0,
      totalDisbursements: 0,
      totalWithdrawals: 0,
      totalTSO: 0,
      totalOnlineCIH: 0,
      operationDays: 0
    };
    summary.avgOnlineCIH = summary.operationDays ? summary.totalOnlineCIH / summary.operationDays : 0;

    // Trend data (last 7 days)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trendData = await DailyOperations.aggregate([
      { $match: { branch: branchObjectId, date: { $gte: sevenDaysAgo, $lte: today } } },
      {
        $lookup: { from: 'cashbooks', localField: 'cashbook1', foreignField: '_id', as: 'cashbook1' }
      },
      { $unwind: { path: '$cashbook1', preserveNullAndEmptyArrays: true } },
      {
        $lookup: { from: 'cashbooks', localField: 'cashbook2', foreignField: '_id', as: 'cashbook2' }
      },
      { $unwind: { path: '$cashbook2', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          date: 1,
          savings: '$cashbook1.savings',
          disbursements: '$cashbook2.disAmt',
          tso: 1,
          onlineCIH: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    return { summary, trendData };
  }

  // Corrected hoDashboard
  static async hoDashboard(req) {
    const { startDate, endDate } = req.query;
    const today = new Date();
    // Date range filter
    let dateFilter = {};
    if (startDate && endDate) {
      const normalizedStart = new Date(startDate);
      normalizedStart.setHours(0, 0, 0, 0);
      const normalizedEnd = new Date(endDate);
      normalizedEnd.setHours(23, 59, 59, 999);
      dateFilter = { date: { $gte: normalizedStart, $lte: normalizedEnd } };
    } else {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { date: { $gte: thirtyDaysAgo, $lte: today } };
    }

    // Aggregated totals for all branches
    const aggregatedOps = await DailyOperations.aggregate([
      { $match: dateFilter },
      {
        $lookup: { from: 'cashbooks', localField: 'cashbook1', foreignField: '_id', as: 'cashbook1' }
      },
      { $unwind: { path: '$cashbook1', preserveNullAndEmptyArrays: true } },
      {
        $lookup: { from: 'cashbooks', localField: 'cashbook2', foreignField: '_id', as: 'cashbook2' }
      },
      { $unwind: { path: '$cashbook2', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$branch',
          totalSavings: { $sum: '$cashbook1.savings' },
          totalLoanCollection: { $sum: '$cashbook1.loanCollection' },
          totalCharges: { $sum: '$cashbook1.chargesCollection' },
          totalDisbursements: { $sum: '$cashbook2.disAmt' },
          totalWithdrawals: { $sum: '$cashbook2.savWith' },
          totalTSO: { $sum: '$tso' },
          totalOnlineCIH: { $sum: '$onlineCIH' },
          operationDays: { $sum: 1 }
        }
      }
    ]);

    const consolidatedSummary = aggregatedOps.reduce(
      (acc, branch) => {
        acc.totalSavings += branch.totalSavings || 0;
        acc.totalLoanCollection += branch.totalLoanCollection || 0;
        acc.totalCharges += branch.totalCharges || 0;
        acc.totalDisbursements += branch.totalDisbursements || 0;
        acc.totalWithdrawals += branch.totalWithdrawals || 0;
        acc.totalTSO += branch.totalTSO || 0;
        acc.totalOnlineCIH += branch.totalOnlineCIH || 0;
        acc.totalOperations += branch.operationDays || 0;
        return acc;
      },
      {
        totalSavings: 0,
        totalLoanCollection: 0,
        totalCharges: 0,
        totalDisbursements: 0,
        totalWithdrawals: 0,
        totalTSO: 0,
        totalOnlineCIH: 0,
        totalOperations: 0
      }
    );
    consolidatedSummary.avgOnlineCIH = consolidatedSummary.totalOperations
      ? consolidatedSummary.totalOnlineCIH / consolidatedSummary.totalOperations
      : 0;

    return { consolidatedSummary };
  }
}

export default DashboardService;
