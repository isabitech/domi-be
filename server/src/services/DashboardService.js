import mongoose from 'mongoose';
import DailyOperations from '../models/DailyOperations.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';

class DashboardService {
  // Branch-level dashboard
  static async branchDashboard(req, branchId) {
    const { startDate, endDate } = req.query;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const branchObjectId = branchId instanceof mongoose.Types.ObjectId
      ? branchId
      : new mongoose.Types.ObjectId(branchId);

    // Date filter for summary (default last 30 days)
    const dateFilter = startDate && endDate
      ? { date: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      : { date: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), $lte: today } };

    const query = { ...dateFilter, branch: branchObjectId };

    // Today's operations
    const todayOperations = await DailyOperations.findOne({
      branch: branchObjectId,
      date: { $gte: startOfToday, $lt: endOfToday }
    }).populate(['cashbook1', 'cashbook2', 'loanRegister', 'savingsRegister']);

    // Summary over the period
    const summaryOps = await DailyOperations.find(query).populate(['cashbook1', 'cashbook2']);
    const summary = summaryOps.reduce((acc, op) => {
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

    // Trend data last 7 days
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trendOps = await DailyOperations.find({
      branch: branchObjectId,
      date: { $gte: sevenDaysAgo, $lte: today }
    }).populate(['cashbook1', 'cashbook2']).sort({ date: 1 });

    const trendData = trendOps.map(op => ({
      date: op.date,
      savings: op.cashbook1?.savings || 0,
      disbursements: op.cashbook2?.disAmt || 0,
      onlineCIH: op.onlineCIH || 0,
      tso: op.tso || 0
    }));

    // Current registers
    let currentLoan = await LoanRegister.findOne({ branch: branchObjectId }).sort({ date: -1 });
    let currentSavings = await SavingsRegister.findOne({ branch: branchObjectId }).sort({ date: -1 });

    if (currentLoan) {
      await currentLoan.calculateCumulativeLoanBalance();
      await currentLoan.save({ validateBeforeSave: false });
    }

    if (currentSavings) {
      await currentSavings.calculateCumulativeSavings();
      await currentSavings.save({ validateBeforeSave: false });
    }

    // Monthly disbursement total from DisbursementRoll
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    let disbursementRoll = await DisbursementRoll.findOne({
      branch: branchObjectId,
      date: { $gte: monthStart, $lte: monthEnd }
    }).sort({ date: -1 });

    let monthlyDisbursement = 0;
    if (disbursementRoll) {
      await disbursementRoll.calculateCumulativeDisbursement();
      await disbursementRoll.save({ validateBeforeSave: false });
      monthlyDisbursement = disbursementRoll.disbursementRoll || 0;
    }

    return {
      todayOperations,
      summary,
      trendData,
      currentRegisters: {
        loanBalance: currentLoan?.currentLoanBalance || 0,
        savingsBalance: currentSavings?.currentSavings || 0,
        monthlyDisbursement
      }
    };
  }

  // Head Office dashboard
  static async hoDashboard(req) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const { startDate, endDate, branchId } = req.query;
    let dateFilter = {};
    if (startDate && endDate) {
      const normalizedStart = new Date(startDate);
      normalizedStart.setHours(0, 0, 0, 0);
      const normalizedEnd = new Date(endDate);
      normalizedEnd.setHours(23, 59, 59, 999);
      dateFilter.date = { $gte: normalizedStart, $lte: normalizedEnd };
    } else {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter.date = { $gte: thirtyDaysAgo, $lte: today };
    }

    const query = branchId
      ? { ...dateFilter, branch: branchId instanceof mongoose.Types.ObjectId ? branchId : new mongoose.Types.ObjectId(branchId) }
      : dateFilter;

    const branches = await Branch.find({ isActive: true }).select('name code').sort({ name: 1 });
    const ops = await DailyOperations.find(query).populate(['branch', 'cashbook1', 'cashbook2']).lean();

    // Aggregate summary
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

    ops.forEach(op => {
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

      const branchKey = op.branch?._id?.toString();
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
    
    // disNo on each branch roll is already a cumulative number that
    // includes the HO baseline (previousDisbursementRollNo) plus all
    // daily disbursement numbers for that branch. Summing disNo across
    // branches would over-add the HO baseline multiple times.
    // To represent the HO-wide cumulative disbursement number, use the
    // maximum disNo value across branches instead of the sum.
    summaryAccumulator.totalDisbursementRollNo = disbursementRolls.reduce(
      (max, roll) => {
        const value = roll.disNo || 0;
        return value > max ? value : max;
      },
      0
    );

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

    for (const roll of disbursementRolls) {
      await roll.calculateCumulativeDisbursement();
      await roll.save({ validateBeforeSave: false });
    }

    summaryAccumulator.totalDisbursementRollNo = disbursementRolls.reduce((sum, r) => sum + (r.disNo || 0), 0);

    const branchPerformance = Array.from(branchMap.values()).map(item => ({
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
    })).sort((a, b) => b.totalSavings - a.totalSavings);

    return {
      branches,
      consolidatedSummary: summaryAccumulator,
      branchPerformance
    };
  }
}

export default DashboardService;
