import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import Prediction from '../models/Prediction.js';
import BankStatement1 from '../models/BankStatement1.js';
import BankStatement2 from '../models/BankStatement2.js';
import DailyOperations from '../models/DailyOperations.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { calcOnlineCIH, calcTSO } from '../utils/formulas.js';

class OperationsService {
  // Date helpers
  static getDayBounds(date) {
    const target = date ? new Date(date) : new Date();
    const start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { target, start, end };
  }

  // Cutoff enforcement
  // static async enforceCutoff() {
  //   const now = new Date();
  //   const cutoffHour = (await import('../config/index.js')).config.server.editCutoffHour;
  //   if (now.getHours() >= cutoffHour) throw new ForbiddenError(`Edit window closed after ${cutoffHour}:00`);
  // }

  // Cashbook builders
  static async buildCashbook1(existingId, branchId, userId, date, data, role) {
    const src = existingId ? await Cashbook1.findById(existingId) : new Cashbook1();
    src.branch = branchId; src.user = userId; src.date = date;
    // pcih is controlled by HO; once set, branch updates must not override it.
    if (role === 'HO') {
      if (data.pcih !== undefined) {
        src.pcih = data.pcih;
      } else if (src.pcih === undefined || src.pcih === null) {
        src.pcih = 0;
      }
    } else {
      if (src.pcih === undefined || src.pcih === null) {
        src.pcih = data.pcih !== undefined ? data.pcih : 0;
      }
    }
    src.savings = data.savings !== undefined ? data.savings : (src.savings || 0);
    src.loanCollection = data.loanCollection !== undefined ? data.loanCollection : (src.loanCollection || 0);
    src.chargesCollection = data.chargesCollection !== undefined ? data.chargesCollection : (src.chargesCollection || 0);
    await src.save();
    return src;
  }

  static async buildCashbook2(existingId, branchId, userId, date, data) {
    const src = existingId ? await Cashbook2.findById(existingId) : new Cashbook2();
    src.branch = branchId; src.user = userId; src.date = date;
    src.disNo = data.disNo !== undefined ? data.disNo : (src.disNo || 0);
    src.disAmt = data.disAmt !== undefined ? data.disAmt : (src.disAmt || 0);
    src.disWithInt = data.disWithInt !== undefined ? data.disWithInt : (src.disWithInt || 0);
    src.savWith = data.savWith !== undefined ? data.savWith : (src.savWith || 0);
    src.domiBank = data.domiBank !== undefined ? data.domiBank : (src.domiBank || 0);
    src.posT = data.posT !== undefined ? data.posT : (src.posT || 0);
    await src.save();
    return src;
  }

  // Prediction builder
  static async buildPrediction(existingId, branchId, userId, baseDate, data) {
    let pred = null;

    if (existingId) {
      pred = await Prediction.findById(existingId);
    }
    if (!pred) {
      pred = new Prediction();
    }
    pred.branch = branchId; pred.user = userId; pred.date = baseDate;
    pred.predictionDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
    pred.predictionNo = data.predictionNo !== undefined ? data.predictionNo : (pred.predictionNo || 0);
    pred.predictionAmount = data.predictionAmount !== undefined ? data.predictionAmount : (pred.predictionAmount || 0);
    await pred.save();
    return pred;
  }

  // Bank statements builders
  static async buildBankStatement1(existingId, branchId, date, cb1, cb2, opening) {
    const bs1 = existingId ? await BankStatement1.findById(existingId) : new BankStatement1();
    bs1.branch = branchId; bs1.date = date;
    bs1.opening = opening !== undefined ? opening : (bs1.opening ?? 0);
    bs1.recHO = cb1.frmHO; bs1.recBO = cb1.frmBR; bs1.domi = cb2.domiBank; bs1.pa = cb2.posT;
    await bs1.save();
    return bs1;
  }

  static async buildBankStatement2(existingId, branchId, userId, date, cb1, data) {
    const bs2 = existingId ? await BankStatement2.findById(existingId) : new BankStatement2();
    bs2.branch = branchId; bs2.user = userId; bs2.date = date;
    bs2.withd = cb1.frmHO;
    bs2.exAmt = data.exAmt !== undefined ? data.exAmt : (bs2.exAmt || 0);
    bs2.exPurpose = data.exPurpose !== undefined ? data.exPurpose : (bs2.exPurpose || '');
    await bs2.save();
    return bs2;
  }

  // Registers builders
  static async buildLoanRegister(existingId, branchId, date, branchMeta, cb2, cb1) {
    const lr = existingId ? await LoanRegister.findById(existingId) : new LoanRegister();
    lr.branch = branchId; lr.date = date;
    lr.previousLoanTotal = branchMeta.previousLoanTotal;
    lr.loanDisbursementWithInterest = cb2.disWithInt;
    lr.loanCollection = cb1.loanCollection;
    await lr.save();
    return lr;
  }

  static async buildSavingsRegister(existingId, branchId, date, branchMeta, cb1, cb2) {
    const sr = existingId ? await SavingsRegister.findById(existingId) : new SavingsRegister();
    sr.branch = branchId; sr.date = date;
    sr.previousSavingsTotal = branchMeta.previousSavingsTotal;
    sr.savings = cb1.savings; sr.savingsWithdrawal = cb2.savWith;
    await sr.save();
    return sr;
  }

  // Disbursement roll upsert
  static async upsertDisbursementRoll(branchId, date, branchMeta, cb2) {
    const month = date.getMonth() + 1; const year = date.getFullYear();
    let roll = await DisbursementRoll.findOne({ branch: branchId, month, year });
    if (!roll) {
      roll = new DisbursementRoll({
        branch: branchId,
        month,
        year,
        previousDisbursement: branchMeta.previousDisbursement,
        previousDisbursementRollNo: branchMeta.previousDisbursementRollNo,
        dailyDisbursement: cb2.disAmt,
        disNo: cb2.disNo
      });
    } else {
      // Treat disAmt as the current month's total from Cashbook2,
      // so edits to the same day don't double-count.
      roll.dailyDisbursement = cb2.disAmt;
      roll.disNo = cb2.disNo;
    }
    await roll.save();
    return roll;
  }

  // Recompute derived totals
  static async applyDerivedTotals(dailyOps, cb1, cb2, bs1, bs2) {
    dailyOps.onlineCIH = calcOnlineCIH(cb1.cbTotal1, cb2.cbTotal2);
    dailyOps.tso = calcTSO(bs1.bs1Total, bs2.bs2Total);
  }
  static async getDaily(req) {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    let query = { date: { $gte: startOfDay, $lt: endOfDay } };
    if (req.user.role === 'BR') query.branch = req.user.branch; else if (branchId) query.branch = branchId;

    const daily = await DailyOperations.findOne(query)
      .populate('branch', 'name code')
      .populate('user', 'name email')
      .populate('cashbook1')
      .populate('cashbook2')
      .populate('prediction')
      .populate('bankStatement1')
      .populate('bankStatement2')
      .populate('loanRegister')
      .populate('savingsRegister');

    // For branch users, preserve original format: just return the document (or null)
    if (req.user.role === 'BR') {
      return daily;
    }

    // For HO and admin, append summary of branches that have not submitted
    if (req.user.role === 'HO' || req.user.role === 'admin') {
      const allActiveBranches = await Branch.find({ isActive: { $ne: false } }).select('_id name code');
      const branchIds = allActiveBranches.map(b => b._id);

      const submittedBranchIds = await DailyOperations.distinct('branch', {
        branch: { $in: branchIds },
        date: { $gte: startOfDay, $lt: endOfDay },
        isCompleted: true
      });

      const submittedSet = new Set(submittedBranchIds.map(id => id.toString()));
      const notSubmittedBranches = allActiveBranches
        .filter(b => !submittedSet.has(b._id.toString()))
        .map(b => ({ id: b._id.toString(), name: b.name, code: b.code }));

      const notSubmittedCount = notSubmittedBranches.length;

      if (!daily) {
        return { daily: null, notSubmittedCount, notSubmittedBranches };
      }

      const dailyObj = daily.toObject();
      return { ...dailyObj, notSubmittedCount, notSubmittedBranches };
    }

    // Fallback for any other role: behave like original
    return daily;
  }

  static async createOrUpdate(req) {
    if (req.user.role !== 'BR') throw new ForbiddenError('Only branch users allowed');
    // await this.enforceCutoff();
    const payload = req.body || {};
    const { target, start, end } = this.getDayBounds(payload.date);

    let dailyOps = await DailyOperations.findOne({ branch: req.user.branch, date: { $gte: start, $lt: end } });

    // Once a daily operation is submitted, prevent further edits for that day.
    if (dailyOps && dailyOps.isCompleted) {
      throw new ForbiddenError('Daily operations already submitted for this date');
    }
    const branchMeta = await Branch.findById(req.user.branch);

    const cb1 = await this.buildCashbook1(dailyOps?.cashbook1, req.user.branch, req.user.id, target, payload, req.user.role);
    const cb2 = await this.buildCashbook2(dailyOps?.cashbook2, req.user.branch, req.user.id, target, payload);
    const prediction = await this.buildPrediction(dailyOps?.prediction, req.user.branch, req.user.id, target, payload);
    const bs1 = await this.buildBankStatement1(dailyOps?.bankStatement1, req.user.branch, target, cb1, cb2, payload.opening);
    const bs2 = await this.buildBankStatement2(dailyOps?.bankStatement2, req.user.branch, req.user.id, target, cb1, payload);
    const loanRegister = await this.buildLoanRegister(dailyOps?.loanRegister, req.user.branch, target, branchMeta, cb2, cb1);
    const savingsRegister = await this.buildSavingsRegister(dailyOps?.savingsRegister, req.user.branch, target, branchMeta, cb1, cb2);
    await this.upsertDisbursementRoll(req.user.branch, target, branchMeta, cb2);

    // Ensure we only ever create one DailyOperations per branch/day.
    if (!dailyOps) {
      const existing = await DailyOperations.findOne({ branch: req.user.branch, date: { $gte: start, $lt: end } });
      if (existing) {
        dailyOps = existing;
      } else {
        dailyOps = new DailyOperations();
        dailyOps.branch = req.user.branch;
        dailyOps.user = req.user.id;
        dailyOps.date = target;
      }
    }
    dailyOps.cashbook1 = cb1._id; dailyOps.cashbook2 = cb2._id; dailyOps.prediction = prediction._id; dailyOps.bankStatement1 = bs1._id; dailyOps.bankStatement2 = bs2._id; dailyOps.loanRegister = loanRegister._id; dailyOps.savingsRegister = savingsRegister._id;
    await this.applyDerivedTotals(dailyOps, cb1, cb2, bs1, bs2);
    await dailyOps.save();
    await dailyOps.populate([
      { path: 'branch', select: 'name code' },
      { path: 'user', select: 'name email' },
      { path: 'cashbook1' },
      { path: 'cashbook2' },
      { path: 'prediction' },
      { path: 'bankStatement1' },
      { path: 'bankStatement2' },
      { path: 'loanRegister' },
      { path: 'savingsRegister' }
    ]);
    return dailyOps;
  }

  static async submit(req) {
    const dailyOps = await DailyOperations.findById(req.params.id);
    if (!dailyOps) throw new NotFoundError('Daily operations not found');
    // Allow submission by the original creator or any user on the same branch
    // const isOwner = dailyOps.user && dailyOps.user.toString() === req.user.id;
    // const isSameBranch = dailyOps.branch && dailyOps.branch.toString() === req.user.branch;
    // if (!isOwner && !isSameBranch) throw new ForbiddenError('Not authorized to submit this record');
    const now = new Date();
    // const cutoffHour = (await import('../config/index.js')).config.server.editCutoffHour;
    // if (now.getHours() >= cutoffHour) {
    //   throw new ForbiddenError(`Too late - cutoff at ${cutoffHour}:00`);
    // }
    dailyOps.isCompleted = true; dailyOps.submittedAt = new Date(); await dailyOps.save();
    if (dailyOps.cashbook1) await Cashbook1.findByIdAndUpdate(dailyOps.cashbook1, { isSubmitted: true, submittedAt: new Date() });
    if (dailyOps.cashbook2) await Cashbook2.findByIdAndUpdate(dailyOps.cashbook2, { isSubmitted: true, submittedAt: new Date() });
    return dailyOps;
  }

  static async updateHOFields(req) {
    if (req.user.role !== 'HO') throw new ForbiddenError('Only HO allowed');
    const { branchId, date } = req.body;
    const { target, start, end } = this.getDayBounds(date);
    await this.updateBranchPreviousValues(req.body, branchId);

    // If HO provided pcih for date D, also apply it to previous day's
    // cashbook and onlineCIH so that pcih is captured for D-1.
    if (req.body.pcih !== undefined) {
      const prevTarget = new Date(target.getTime() - 24 * 60 * 60 * 1000);
      const { start: prevStart, end: prevEnd } = this.getDayBounds(prevTarget);

      const prevDailyOps = await DailyOperations.findOne({
        branch: branchId,
        date: { $gte: prevStart, $lt: prevEnd }
      });

      if (prevDailyOps) {
        const [cb1Prev, cb2Prev, bs1Prev, bs2Prev] = await Promise.all([
          Cashbook1.findById(prevDailyOps.cashbook1),
          Cashbook2.findById(prevDailyOps.cashbook2),
          BankStatement1.findById(prevDailyOps.bankStatement1),
          BankStatement2.findById(prevDailyOps.bankStatement2)
        ]);

        if (cb1Prev && cb2Prev && bs1Prev && bs2Prev) {
          cb1Prev.pcih = req.body.pcih;
          await cb1Prev.save();

          await this.applyDerivedTotals(prevDailyOps, cb1Prev, cb2Prev, bs1Prev, bs2Prev);
          await prevDailyOps.save();
        }
      }
    }

    // Load current dailyOps (HO never creates duplicates; index enforces one per branch/day)
    let dailyOps = await DailyOperations.findOne({ branch: branchId, date: { $gte: start, $lt: end } });
    const branchMeta = await Branch.findById(branchId);

    // Seed zero/default payload so HO can create missing records
    const seedPayload = {
      pcih: req.body.pcih !== undefined ? req.body.pcih : 0,
      savings: 0,
      loanCollection: 0,
      chargesCollection: 0,
      disNo: 0,
      disAmt: 0,
      disWithInt: 0,
      savWith: 0,
      domiBank: 0,
      posT: 0,
      predictionNo: 0,
      predictionAmount: 0,
      exAmt: 0,
      exPurpose: ''
    };

    const cb1 = await this.buildCashbook1(dailyOps?.cashbook1, branchId, req.user.id, target, seedPayload, req.user.role);
    const cb2 = await this.buildCashbook2(dailyOps?.cashbook2, branchId, req.user.id, target, seedPayload);
    const prediction = await this.buildPrediction(dailyOps?.prediction, branchId, req.user.id, target, seedPayload);
    const bs1 = await this.buildBankStatement1(dailyOps?.bankStatement1, branchId, target, cb1, cb2, dailyOps?.bankStatement1 ? undefined : 0);
    const bs2 = await this.buildBankStatement2(dailyOps?.bankStatement2, branchId, req.user.id, target, cb1, seedPayload);
    const loanRegister = await this.buildLoanRegister(dailyOps?.loanRegister, branchId, target, branchMeta, cb2, cb1);
    const savingsRegister = await this.buildSavingsRegister(dailyOps?.savingsRegister, branchId, target, branchMeta, cb1, cb2);

    if (!dailyOps) {
      dailyOps = new DailyOperations({ branch: branchId, user: req.user.id, date: target });
    }

    dailyOps.cashbook1 = cb1._id;
    dailyOps.cashbook2 = cb2._id;
    dailyOps.prediction = prediction._id;
    dailyOps.bankStatement1 = bs1._id;
    dailyOps.bankStatement2 = bs2._id;
    dailyOps.loanRegister = loanRegister._id;
    dailyOps.savingsRegister = savingsRegister._id;

    // Now apply HO-only adjustments on top (frmHO/frmBR, TBO, previous values already handled)
    await this.updateCashbookHOFields(dailyOps.cashbook1, req.body);
    await this.updateBankStatementTBO(dailyOps.bankStatement2, req.body);

    // Re-load updated docs for derived totals
    const cb1After = await Cashbook1.findById(dailyOps.cashbook1);
    const cb2After = await Cashbook2.findById(dailyOps.cashbook2);
    const bs1After = await BankStatement1.findById(dailyOps.bankStatement1);
    const bs2After = await BankStatement2.findById(dailyOps.bankStatement2);

    await this.applyDerivedTotals(dailyOps, cb1After, cb2After, bs1After, bs2After);
    await dailyOps.save();

    return { message: 'HO fields updated successfully' };
  }

  static async updateBranchPreviousValues(body, branchId) {
    const { previousLoanTotal, previousSavingsTotal, previousDisbursement, previousDisbursementRollNo, loanMultiplier } = body;
    const updateData = {};
    if (previousLoanTotal !== undefined) updateData.previousLoanTotal = previousLoanTotal;
    if (previousSavingsTotal !== undefined) updateData.previousSavingsTotal = previousSavingsTotal;
    if (previousDisbursement !== undefined) updateData.previousDisbursement = previousDisbursement;
    if (previousDisbursementRollNo !== undefined) updateData.previousDisbursementRollNo = previousDisbursementRollNo;
    if (loanMultiplier !== undefined) updateData.loanMultiplier = loanMultiplier;
    if (Object.keys(updateData).length) await Branch.findByIdAndUpdate(branchId, updateData);
  }

  static async updateCashbookHOFields(cashbook1Id, body) {
    if (!cashbook1Id) return;
    const { frmHO, frmBR } = body;
    const updateData = {};
    if (frmHO !== undefined) updateData.frmHO = frmHO;
    if (frmBR !== undefined) updateData.frmBR = frmBR;
    if (Object.keys(updateData).length) await Cashbook1.findByIdAndUpdate(cashbook1Id, updateData);
  }

  static async updateBankStatementTBO(bs2Id, body) {
    if (!bs2Id) return;
    const { tbo, tboTargetBranch } = body;
    const updateData = {};
    if (tbo !== undefined) updateData.tbo = tbo;
    if (tboTargetBranch !== undefined) updateData.tboTargetBranch = tboTargetBranch;
    if (Object.keys(updateData).length) await BankStatement2.findByIdAndUpdate(bs2Id, updateData);
  }

  // Fetch all daily operations
  static async getAllDaily(req) {
    const { branchId, date } = req.query;

    const query = {};
    if (date) {
      const { start, end } = this.getDayBounds(date);
      query.date = { $gte: start, $lt: end };
    }

    if (req.user.role === 'BR') {
      query.branch = req.user.branch;
    } else if (req.user.role === 'admin' && branchId) {
      query.branch = branchId;
    } else if (branchId) {
      query.branch = branchId;
    }

    const operations = await DailyOperations.find(query)
      .populate('branch', 'name code')
      .populate('user', 'name email')
      .populate('cashbook1')
      .populate('cashbook2')
      .populate('prediction')
      .populate('bankStatement1')
      .populate('bankStatement2')
      .populate('loanRegister')
      .populate('savingsRegister')
      .sort({ date: -1 });

    const totals = operations.reduce(
      (acc, op) => {
        const cb1 = op.cashbook1 || {};
        const cb2 = op.cashbook2 || {};

        const savings = cb1.savings || 0;
        const loanCollection = cb1.loanCollection || 0;
        const chargesCollection = cb1.chargesCollection || 0;
        const disNo = cb2.disNo || 0;
        const disAmt = cb2.disAmt || 0;

        acc.totalCollections += savings + loanCollection + chargesCollection;
        acc.totalDisbursementNumber += disNo;
        acc.totalDisbursementAmount += disAmt;
        return acc;
      },
      { totalCollections: 0, totalDisbursementNumber: 0, totalDisbursementAmount: 0 }
    );

    // Attach predictions and disbursement roll snapshot per operation
    const operationsWithExtras = await Promise.all(
      operations.map(async (op) => {
        const opObj = op.toObject();

        const predictions = {
          predictionNo: op.prediction?.predictionNo || 0,
          predictionAmount: op.prediction?.predictionAmount || 0
        };

        let disbursementRoll = null;
        if (op.branch && op.date) {
          const month = op.date.getMonth() + 1;
          const year = op.date.getFullYear();
          disbursementRoll = await DisbursementRoll.findOne({
            branch: op.branch._id,
            month,
            year
          }).lean();
        }

        return {
          ...opObj,
          predictions,
          disbursementRoll
        };
      })
    );

    return {
      operations: operationsWithExtras,
      total: operations.length,
      totals
    };
  }

  // History listing with pagination & filters
  static async listHistory(req) {
    const { startDate, endDate, branchId } = req.query;
    const { page, limit, skip } = (await import('../utils/pagination.js')).parsePagination(req.query);

    // Date range defaults: last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const query = { date: { $gte: start, $lte: end } };
    if (req.user.role === 'BR') {
      query.branch = req.user.branch;
    } else if (branchId) {
      query.branch = branchId;
    }

    const total = await DailyOperations.countDocuments(query);
    const records = await DailyOperations.find(query)
      .populate('branch', 'name code')
      .populate('cashbook1')
      .populate('cashbook2')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const { buildPaginationMeta } = await import('../utils/pagination.js');
    return {
      records,
      total,
      page,
      limit,
      pagination: buildPaginationMeta(total, page, limit),
      range: { start, end }
    };
  }
}

export default OperationsService;
