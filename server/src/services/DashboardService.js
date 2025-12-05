import mongoose from 'mongoose';
import DailyOperations from '../models/DailyOperations.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';

class DashboardService {
  static async branchDashboard(req, branchId) {
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

    const resolvedBranchId = branchId && branchId._id ? branchId._id : branchId;
    const branchObjectId = resolvedBranchId
      ? resolvedBranchId instanceof mongoose.Types.ObjectId
        ? resolvedBranchId
        : new mongoose.Types.ObjectId(resolvedBranchId)
      : null;
    const query = { ...dateFilter };
    if (branchObjectId) query.branch = branchObjectId;

    const todayOperations = await DailyOperations.findOne({
      branch: resolvedBranchId,
      date: { $gte: startOfToday, $lt: endOfToday }
    }).populate(['cashbook1', 'cashbook2', 'loanRegister', 'savingsRegister']);

    const summaryOperations = await DailyOperations.find(query).populate(['cashbook1', 'cashbook2']);
    const summary = summaryOperations.reduce((acc, op) => {
      acc.totalSavings += op.cashbook1?.savings || 0;
      acc.totalLoanCollection += op.cashbook1?.loanCollection || 0;
      acc.totalCharges += op.cashbook1?.chargesCollection || 0;
      acc.totalDisbursements += op.cashbook2?.disAmt || 0;
      acc.totalWithdrawals += op.cashbook2?.savWith || 0;
      acc.totalTSO += op.tso || 0;
      acc.totalOnlineCIHSum += op.onlineCIH || 0;
      acc.operationDays += 1;
      return acc;
    }, {
      totalSavings: 0,
      totalLoanCollection: 0,
      totalCharges: 0,
      totalDisbursements: 0,
      totalWithdrawals: 0,
      totalTSO: 0,
      totalOnlineCIHSum: 0,
      operationDays: 0
    });
    summary.avgOnlineCIH = summary.operationDays ? summary.totalOnlineCIHSum / summary.operationDays : 0;
    delete summary.totalOnlineCIHSum;

    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trendDataRaw = await DailyOperations.find({
      branch: resolvedBranchId,
      date: { $gte: sevenDaysAgo, $lte: today }
    }).populate(['cashbook1', 'cashbook2']).sort({ date: 1 });

    // Get the most recent loan and savings register entries with recalculated values
    let currentLoanRegister = await LoanRegister.findOne({ branch: resolvedBranchId }).sort({ date: -1 });
    let currentSavingsRegister = await SavingsRegister.findOne({ branch: resolvedBranchId }).sort({ date: -1 });

    // Ensure the latest entries have up-to-date cumulative calculations
    if (currentLoanRegister) {
      await currentLoanRegister.calculateCumulativeLoanBalance();
      await currentLoanRegister.save({ validateBeforeSave: false });
    }

    if (currentSavingsRegister) {
      await currentSavingsRegister.calculateCumulativeSavings();
      await currentSavingsRegister.save({ validateBeforeSave: false });
    }

    // Compute disbursement total using: previousDisbursement + sum of all dailyDisbursement from rolls
    const branchMeta = await Branch.findById(resolvedBranchId);

    const prevDisbursement = branchMeta?.previousDisbursement || 0;

    // Sum dailyDisbursement across all DisbursementRoll records for this branch
    const allDisbursementRolls = await DisbursementRoll.find({ branch: resolvedBranchId }).lean();
    const totalDailyDisbursementFromRolls = allDisbursementRolls.reduce(
      (sum, roll) => sum + (roll.dailyDisbursement || 0),
      0
    );

    const monthlyDisbursementTotal = prevDisbursement + totalDailyDisbursementFromRolls;

    return {
      todayOperations,
      summary,
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
        monthlyDisbursement: monthlyDisbursementTotal
      }
    };
  }

  static async hoDashboard(req) {
    const { startDate, endDate, branchId } = req.query;
    const today = new Date();

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

    let query = { ...dateFilter };
    if (branchId) {
      const branchObjectId = branchId instanceof mongoose.Types.ObjectId ? branchId : new mongoose.Types.ObjectId(branchId);
      query.branch = branchObjectId;
    }

    const branches = await Branch.find({ isActive: true }).select('name code').sort({ name: 1 });

    const aggregatedOps = await DailyOperations.find(query)
      .populate([
        { path: 'branch', select: 'name code' },
        { path: 'cashbook1' },
        { path: 'cashbook2' }
      ])
      .lean();

    const summaryAccumulator = {
      totalSavings: 0,
      totalLoanCollection: 0,
      totalCharges: 0,
      totalDisbursements: 0,
      totalWithdrawals: 0,
      totalOnlineCIH: 0,
      totalTSO: 0,
      totalFrmHO: 0,
      totalDisbursementRollNo: 0,
      activeBranches: new Set(),
      totalOperations: 0
    };
    const branchMap = new Map();

    aggregatedOps.forEach(op => {
      const cb1 = op.cashbook1 || {};
      const cb2 = op.cashbook2 || {};
      summaryAccumulator.totalSavings += cb1.savings || 0;
      summaryAccumulator.totalLoanCollection += cb1.loanCollection || 0;
      summaryAccumulator.totalCharges += cb1.chargesCollection || 0;
      summaryAccumulator.totalFrmHO += cb1.frmHO || 0;
      summaryAccumulator.totalDisbursements += cb2.disAmt || 0;
      summaryAccumulator.totalWithdrawals += cb2.savWith || 0;
      summaryAccumulator.totalOnlineCIH += op.onlineCIH || 0;
      summaryAccumulator.totalTSO += op.tso || 0;
      summaryAccumulator.totalOperations += 1;
      if (op.branch?._id) summaryAccumulator.activeBranches.add(op.branch._id.toString());

      const branchKey = op.branch?._id?.toString() || op.branch?.toString();
      if (!branchKey) return;
      if (!branchMap.has(branchKey)) {
        branchMap.set(branchKey, {
          _id: op.branch._id,
          branchName: op.branch.name,
          branchCode: op.branch.code,
          totalSavings: 0,
          totalLoanCollection: 0,
          totalDisbursements: 0,
          totalTSO: 0,
          onlineCIHSum: 0,
          operationDays: 0,
          lastOperation: op.date
        });
      }
      const branchStats = branchMap.get(branchKey);
      branchStats.totalSavings += cb1.savings || 0;
      branchStats.totalLoanCollection += cb1.loanCollection || 0;
      branchStats.totalDisbursements += cb2.disAmt || 0;
      branchStats.totalTSO += op.tso || 0;
      branchStats.onlineCIHSum += op.onlineCIH || 0;
      branchStats.operationDays += 1;
      if (!branchStats.lastOperation || op.date > branchStats.lastOperation) branchStats.lastOperation = op.date;
    });

    // Aggregate disbursement roll numbers for the same branch scope and period (now from daily entries)
    const disRollQuery = { date: dateFilter.date || { $exists: true } };
    if (branchId) {
      const branchObjectId = branchId instanceof mongoose.Types.ObjectId ? branchId : new mongoose.Types.ObjectId(branchId);
      disRollQuery.branch = branchObjectId;
    }
    
    // Get the latest disbursement roll entry for each branch to get current cumulative totals
    const disbursementRolls = await DisbursementRoll.aggregate([
      { $match: disRollQuery },
      { $sort: { branch: 1, date: -1 } },
      { $group: { _id: '$branch', latestEntry: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latestEntry' } }
    ]);
    
    // Ensure each latest entry has up-to-date calculations
    for (const rollData of disbursementRolls) {
      const roll = await DisbursementRoll.findById(rollData._id);
      if (roll) {
        await roll.calculateCumulativeDisbursement();
        await roll.save({ validateBeforeSave: false });
      }
    }
    
    summaryAccumulator.totalDisbursementRollNo = disbursementRolls.reduce((sum, roll) => sum + (roll.disNo || 0), 0);

    const consolidatedSummary = summaryAccumulator.totalOperations
      ? {
          totalSavings: summaryAccumulator.totalSavings,
          totalLoanCollection: summaryAccumulator.totalLoanCollection,
          totalCharges: summaryAccumulator.totalCharges,
          totalDisbursements: summaryAccumulator.totalDisbursements,
          totalWithdrawals: summaryAccumulator.totalWithdrawals,
          totalOnlineCIH: summaryAccumulator.totalOnlineCIH,
          totalTSO: summaryAccumulator.totalTSO,
          totalFrmHO: summaryAccumulator.totalFrmHO,
          totalDisbursementRollNo: summaryAccumulator.totalDisbursementRollNo,
          totalCollections:
            summaryAccumulator.totalLoanCollection +
            summaryAccumulator.totalSavings +
            summaryAccumulator.totalCharges,
          activeBranches: Array.from(summaryAccumulator.activeBranches),
          totalOperations: summaryAccumulator.totalOperations
        }
      : {
          totalSavings: 0,
          totalLoanCollection: 0,
          totalCharges: 0,
          totalDisbursements: 0,
          totalWithdrawals: 0,
          totalOnlineCIH: 0,
          totalTSO: 0,
          totalFrmHO: 0,
          totalDisbursementRollNo: 0,
          totalCollections: 0,
          activeBranches: [],
          totalOperations: 0
        };

    const branchPerformance = Array.from(branchMap.values())
      .map(item => ({
        _id: item._id,
        branchName: item.branchName,
        branchCode: item.branchCode,
        totalSavings: item.totalSavings,
        totalLoanCollection: item.totalLoanCollection,
        totalDisbursements: item.totalDisbursements,
        avgOnlineCIH: item.operationDays ? item.onlineCIHSum / item.operationDays : 0,
        totalTSO: item.totalTSO,
        operationDays: item.operationDays,
        lastOperation: item.lastOperation
      }))
      .sort((a, b) => b.totalSavings - a.totalSavings);

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const todayStatus = await DailyOperations.aggregate([
      { $match: { date: { $gte: startOfToday, $lt: endOfToday } } },
      { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
      { $unwind: '$branchInfo' },
      { $project: { branchName: '$branchInfo.name', branchCode: '$branchInfo.code', isCompleted: 1, submittedAt: 1, onlineCIH: 1, tso: 1 } }
    ]);

    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trendOps = await DailyOperations.find({ date: { $gte: thirtyDaysAgo, $lte: today } })
      .populate([{ path: 'cashbook1' }, { path: 'cashbook2' }])
      .lean();
    const trendMap = new Map();
    trendOps.forEach(op => {
      const key = new Date(op.date).toISOString().split('T')[0];
      if (!trendMap.has(key)) {
        trendMap.set(key, {
          date: op.date,
          totalSavings: 0,
          totalDisbursements: 0,
          totalTSO: 0,
          operatingBranches: 0
        });
      }
      const entry = trendMap.get(key);
      entry.totalSavings += op.cashbook1?.savings || 0;
      entry.totalDisbursements += op.cashbook2?.disAmt || 0;
      entry.totalTSO += op.tso || 0;
      entry.operatingBranches += 1;
      if (op.date > entry.date) entry.date = op.date;
    });
    const trendData = Array.from(trendMap.values()).sort((a, b) => a.date - b.date);

    return {
      branches,
      consolidatedSummary,
      branchPerformance,
      todayStatus,
      trendData
    };
  }
}

export default DashboardService;
