import DailyOperations from '../models/DailyOperations.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import { ForbiddenError, ValidationError } from '../utils/errors.js';


class ReportsService {
  // Helper: Build daily query
  static buildDailyQuery(req) {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    let query = { date: { $gte: startOfDay, $lt: endOfDay } };
    if (req.user.role === 'BR') query.branch = req.user.branch;
    else if (branchId) query.branch = branchId;
    return { query, targetDate };
  }

  // Helper: Populate daily operations
  static async populateDailyOperations(query) {
    return DailyOperations.find(query).populate([
      { path: 'branch', select: 'name code' },
      { path: 'user', select: 'name email' },
      { path: 'cashbook1' },
      { path: 'cashbook2' },
      { path: 'prediction' },
      { path: 'bankStatement1' },
      { path: 'bankStatement2' },
      { path: 'loanRegister' },
      { path: 'savingsRegister' }
    ]).sort({ branch: 1 });
  }

  // Helper: Map daily report data
  static mapDailyReport(operations) {
    return operations.map(op => {
      const savings = op.cashbook1?.savings || 0;
      const loanCollection = op.cashbook1?.loanCollection || 0;
      const chargesCollection = op.cashbook1?.chargesCollection || 0;
      const disNo = op.cashbook2?.disNo || 0;
      const disAmt = op.cashbook2?.disAmt || 0;

      return {
        branch: { name: op.branch.name, code: op.branch.code },
        user: { name: op.user.name, email: op.user.email },
        cashbook1: {
          pcih: op.cashbook1?.pcih || 0,
          savings,
          loanCollection,
          chargesCollection,
          total: op.cashbook1?.total || 0,
          frmHO: op.cashbook1?.frmHO || 0,
          frmBR: op.cashbook1?.frmBR || 0,
          cbTotal1: op.cashbook1?.cbTotal1 || 0
        },
        cashbook2: {
          disNo,
          disAmt,
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
        calculated: { onlineCIH: op.onlineCIH, tso: op.tso },
        status: { isCompleted: op.isCompleted, submittedAt: op.submittedAt },
        totals: {
          collections: savings + loanCollection + chargesCollection,
          disbursementNumber: disNo,
          disbursementAmount: disAmt
        }
      };
    });
  }

  static async daily(req) {
    const { query, targetDate } = ReportsService.buildDailyQuery(req);
    const operations = await ReportsService.populateDailyOperations(query);
    const mapped = ReportsService.mapDailyReport(operations);

    const grandTotals = mapped.reduce(
      (acc, item) => {
        acc.totalCollections += item.totals.collections || 0;
        acc.totalDisbursementNumber += item.totals.disbursementNumber || 0;
        acc.totalDisbursementAmount += item.totals.disbursementAmount || 0;
        return acc;
      },
      { totalCollections: 0, totalDisbursementNumber: 0, totalDisbursementAmount: 0 }
    );

    return {
      reportDate: targetDate,
      generatedAt: new Date(),
      generatedBy: req.user.name,
      operations: mapped,
      totals: grandTotals
    };
  }

  static async monthly(req) {
    const { targetMonth, targetYear, query, branchId } = ReportsService.buildMonthlyQuery(req);
    const monthlySummary = await ReportsService.aggregateMonthlySummary(query);
    const disbursementRolls = await ReportsService.fetchDisbursementRolls(req, targetMonth, targetYear, branchId);
    const registerMovement = await ReportsService.aggregateRegisterMovement(query);
    return { month: targetMonth, year: targetYear, generatedAt: new Date(), generatedBy: req.user.name, monthlySummary, disbursementRolls, registerMovement };
  }

  // Helper: Build monthly query
  static buildMonthlyQuery(req) {
    const { month, year, branchId } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    let query = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    if (req.user.role === 'BR') query.branch = req.user.branch; else if (branchId) query.branch = branchId;
    return { targetMonth, targetYear, query, branchId };
  }

  // Helper: Aggregate monthly summary
  static async aggregateMonthlySummary(query) {
    return DailyOperations.aggregate([
      { $match: query },
      { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
      { $lookup: { from: 'cashbook1s', localField: 'cashbook1', foreignField: '_id', as: 'cb1' } },
      { $lookup: { from: 'cashbook2s', localField: 'cashbook2', foreignField: '_id', as: 'cb2' } },
      { $unwind: '$branchInfo' }, { $unwind: '$cb1' }, { $unwind: '$cb2' },
      { $group: { _id: '$branch', branchName: { $first: '$branchInfo.name' }, branchCode: { $first: '$branchInfo.code' }, totalSavings: { $sum: '$cb1.savings' }, totalLoanCollection: { $sum: '$cb1.loanCollection' }, totalCharges: { $sum: '$cb1.chargesCollection' }, totalDisbursements: { $sum: '$cb2.disAmt' }, totalWithdrawals: { $sum: '$cb2.savWith' }, totalTSO: { $sum: '$tso' }, operatingDays: { $sum: 1 }, avgOnlineCIH: { $avg: '$onlineCIH' } } }
    ]);
  }

  // Helper: Fetch disbursement rolls
  static async fetchDisbursementRolls(req, targetMonth, targetYear, branchId) {
    return DisbursementRoll.find({ month: targetMonth, year: targetYear, ...(req.user.role === 'BR' ? { branch: req.user.branch } : {}), ...(branchId ? { branch: branchId } : {}) })
      .populate('branch', 'name code')
      .sort({ 'branch.name': 1 });
  }

  // Helper: Aggregate register movement
  static async aggregateRegisterMovement(query) {
    return DailyOperations.aggregate([
      { $match: query },
      { $lookup: { from: 'loanregisters', localField: 'loanRegister', foreignField: '_id', as: 'loanReg' } },
      { $lookup: { from: 'savingsregisters', localField: 'savingsRegister', foreignField: '_id', as: 'savReg' } },
      { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
      { $unwind: '$branchInfo' }, { $unwind: '$loanReg' }, { $unwind: '$savReg' },
      { $group: { _id: '$branch', branchName: { $first: '$branchInfo.name' }, openingLoanBalance: { $first: '$loanReg.previousLoanTotal' }, closingLoanBalance: { $last: '$loanReg.currentLoanBalance' }, openingSavingsBalance: { $first: '$savReg.previousSavingsTotal' }, closingSavingsBalance: { $last: '$savReg.currentSavings' } } }
    ]);
  }

  static async consolidated(req) {
    if (req.user.role !== 'HO' && req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied. Head Office users only.');
    }
    const { dateFilter, periodStart, periodEnd, scope } = ReportsService.buildConsolidatedDateFilter(req);
    const operations = await ReportsService.fetchConsolidatedOperations(dateFilter);
    const { consolidatedData, grandTotals } = ReportsService.buildConsolidatedSummaries(operations);
    const currentRegisters = await ReportsService.fetchCurrentRegisters();
    return ReportsService.assembleConsolidatedReport(req, periodStart, periodEnd, consolidatedData, grandTotals, currentRegisters, scope);
  }

  // Helper: Build consolidated date filter
  static buildConsolidatedDateFilter(req) {
    const { startDate, endDate, scope } = req.query;
    if ((scope && scope.toLowerCase() === 'all') || req.query.allDates === 'true') {
      return { dateFilter: {}, periodStart: null, periodEnd: null, scope: 'all' };
    }
    const today = new Date();
    if (startDate && endDate) {
      const normalizedStart = new Date(startDate);
      normalizedStart.setHours(0, 0, 0, 0);
      const normalizedEnd = new Date(endDate);
      normalizedEnd.setHours(23, 59, 59, 999);
      return {
        dateFilter: { date: { $gte: normalizedStart, $lte: normalizedEnd } },
        periodStart: normalizedStart,
        periodEnd: normalizedEnd,
        scope: 'range'
      };
    }
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    return { dateFilter: { date: { $gte: periodStart, $lte: periodEnd } }, periodStart, periodEnd, scope: 'currentMonth' };
  }

  // Helper: Fetch consolidated operations with relations
  static async fetchConsolidatedOperations(dateFilter) {
    const match = dateFilter?.date ? dateFilter : {};
    return DailyOperations.find(match)
      .populate([
        { path: 'branch', select: 'name code' },
        { path: 'cashbook1' },
        { path: 'cashbook2' }
      ])
      .lean();
  }

  // Helper: Build consolidated summaries from populated operations
  static buildConsolidatedSummaries(operations) {
    const branchMap = new Map();
    const totals = {
      totalSavings: 0,
      totalLoanCollection: 0,
      totalCharges: 0,
      totalDisbursements: 0,
      totalWithdrawals: 0,
      totalTSO: 0,
      totalOnlineCIH: 0,
      activeBranches: new Set(),
      totalOperations: 0
    };

    operations.forEach(op => {
      const branchId = op.branch?._id?.toString() || op.branch?.toString();
      const branchName = op.branch?.name || 'Unknown Branch';
      const branchCode = op.branch?.code || 'N/A';
      const cb1 = op.cashbook1 || {};
      const cb2 = op.cashbook2 || {};
      const savings = cb1.savings || 0;
      const loanCollection = cb1.loanCollection || 0;
      const charges = cb1.chargesCollection || 0;
      const disbursements = cb2.disAmt || 0;
      const withdrawals = cb2.savWith || 0;
      const tso = op.tso || 0;
      const onlineCIH = op.onlineCIH || 0;

      totals.totalSavings += savings;
      totals.totalLoanCollection += loanCollection;
      totals.totalCharges += charges;
      totals.totalDisbursements += disbursements;
      totals.totalWithdrawals += withdrawals;
      totals.totalTSO += tso;
      totals.totalOnlineCIH += onlineCIH;
      totals.totalOperations += 1;
      if (branchId) totals.activeBranches.add(branchId);

      if (!branchId) return;
      if (!branchMap.has(branchId)) {
        branchMap.set(branchId, {
          _id: op.branch?._id || branchId,
          branchName,
          branchCode,
          totalSavings: 0,
          totalLoanCollection: 0,
          totalCharges: 0,
          totalDisbursements: 0,
          totalWithdrawals: 0,
          totalTSO: 0,
          onlineCIHSum: 0,
          operatingDays: 0,
          lastOperationDate: null
        });
      }
      const branchStats = branchMap.get(branchId);
      branchStats.totalSavings += savings;
      branchStats.totalLoanCollection += loanCollection;
      branchStats.totalCharges += charges;
      branchStats.totalDisbursements += disbursements;
      branchStats.totalWithdrawals += withdrawals;
      branchStats.totalTSO += tso;
      branchStats.onlineCIHSum += onlineCIH;
      branchStats.operatingDays += 1;
      if (!branchStats.lastOperationDate || op.date > branchStats.lastOperationDate) {
        branchStats.lastOperationDate = op.date;
      }
    });

    const consolidatedData = Array.from(branchMap.values())
      .map(item => ({
        _id: item._id,
        branchName: item.branchName,
        branchCode: item.branchCode,
        totalSavings: item.totalSavings,
        totalLoanCollection: item.totalLoanCollection,
        totalCharges: item.totalCharges,
        totalDisbursements: item.totalDisbursements,
        totalWithdrawals: item.totalWithdrawals,
        totalTSO: item.totalTSO,
        avgOnlineCIH: item.operatingDays ? item.onlineCIHSum / item.operatingDays : 0,
        operatingDays: item.operatingDays,
        lastOperationDate: item.lastOperationDate
      }))
      .sort((a, b) => b.totalSavings - a.totalSavings);

    return {
      consolidatedData,
      grandTotals: {
        totalSavings: totals.totalSavings,
        totalLoanCollection: totals.totalLoanCollection,
        totalCharges: totals.totalCharges,
        totalDisbursements: totals.totalDisbursements,
        totalWithdrawals: totals.totalWithdrawals,
        totalTSO: totals.totalTSO,
        totalOnlineCIH: totals.totalOnlineCIH,
        activeBranches: Array.from(totals.activeBranches),
        totalOperations: totals.totalOperations
      }
    };
  }

  // Helper: Fetch latest register balances per branch
  static async fetchCurrentRegisters() {
    const branches = await Branch.find().lean();
    const results = [];

    for (const branch of branches) {
      // Get the most recent registers and ensure they have up-to-date calculations
      let latestLoanRegister = await LoanRegister.findOne({ branch: branch._id }).sort({ date: -1 });
      let latestSavingsRegister = await SavingsRegister.findOne({ branch: branch._id }).sort({ date: -1 });

      // Recalculate to ensure latest cumulative values
      if (latestLoanRegister) {
        await latestLoanRegister.calculateCumulativeLoanBalance();
        await latestLoanRegister.save({ validateBeforeSave: false });
      }

      if (latestSavingsRegister) {
        await latestSavingsRegister.calculateCumulativeSavings();
        await latestSavingsRegister.save({ validateBeforeSave: false });
      }

      results.push({
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        currentLoanBalance: latestLoanRegister?.currentLoanBalance || 0,
        currentSavingsBalance: latestSavingsRegister?.currentSavings || 0
      });
    }

    return results;
  }

  // Helper: Assemble consolidated response
  static assembleConsolidatedReport(req, periodStart, periodEnd, consolidatedData, grandTotals, currentRegisters, scope = 'range') {
    return {
      period: { startDate: periodStart, endDate: periodEnd, scope },
      generatedAt: new Date(),
      generatedBy: req.user.name,
      consolidatedData,
      grandTotals,
      currentRegisters
    };
  }

  static async custom(req) {
    const params = ReportsService.validateAndExtractCustomParams(req);
    const query = ReportsService.buildCustomQuery(req, params);
    const grouping = ReportsService.buildGrouping(params.groupBy);
    const pipeline = ReportsService.buildCustomPipeline(query, grouping);
    const results = await ReportsService.runCustomAggregation(pipeline);
    return ReportsService.assembleCustomReport(req, params, results);
  }

  // Helper: Validate and normalize custom report params
  static validateAndExtractCustomParams(req) {
    const { startDate, endDate, branchIds, reportType, groupBy } = req.query;
    if (!startDate || !endDate) throw new ValidationError('Start date and end date are required');
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      branchIds: branchIds ? (Array.isArray(branchIds) ? branchIds : branchIds.split(',')) : null,
      reportType: reportType || 'summary',
      groupBy: groupBy || 'branch'
    };
  }

  // Helper: Build custom query
  static buildCustomQuery(req, params) {
    const base = { date: { $gte: params.startDate, $lte: params.endDate } };
    if (req.user.role === 'BR') return { ...base, branch: req.user.branch };
    if (params.branchIds) return { ...base, branch: { $in: params.branchIds } };
    return base;
  }

  // Helper: Build grouping object
  static buildGrouping(groupBy) {
    if (groupBy === 'day') return { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' }, branch: '$branch' };
    if (groupBy === 'week') return { year: { $year: '$date' }, week: { $week: '$date' }, branch: '$branch' };
    if (groupBy === 'month') return { year: { $year: '$date' }, month: { $month: '$date' }, branch: '$branch' };
    return { branch: '$branch' };
  }

  // Helper: Build custom aggregation pipeline
  static buildCustomPipeline(query, grouping) {
    const pipeline = [
      { $match: query },
      { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
      { $lookup: { from: 'cashbook1s', localField: 'cashbook1', foreignField: '_id', as: 'cb1' } },
      { $lookup: { from: 'cashbook2s', localField: 'cashbook2', foreignField: '_id', as: 'cb2' } },
      { $unwind: '$branchInfo' }, { $unwind: '$cb1' }, { $unwind: '$cb2' },
      { $group: { _id: grouping, branchName: { $first: '$branchInfo.name' }, branchCode: { $first: '$branchInfo.code' }, period: { $first: '$date' }, totalSavings: { $sum: '$cb1.savings' }, totalLoanCollection: { $sum: '$cb1.loanCollection' }, totalCharges: { $sum: '$cb1.chargesCollection' }, totalDisbursements: { $sum: '$cb2.disAmt' }, totalWithdrawals: { $sum: '$cb2.savWith' }, avgOnlineCIH: { $avg: '$onlineCIH' }, totalTSO: { $sum: '$tso' }, operationCount: { $sum: 1 } } },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ];
    return pipeline;
  }

  // Helper: Run custom aggregation
  static async runCustomAggregation(pipeline) {
    return DailyOperations.aggregate(pipeline);
  }

  // Helper: Assemble custom report response
  static assembleCustomReport(req, params, results) {
    return {
      period: { startDate: params.startDate, endDate: params.endDate },
      reportType: params.reportType,
      groupBy: params.groupBy,
      generatedAt: new Date(),
      generatedBy: req.user.name,
      results
    };
  }
}

export default ReportsService;
