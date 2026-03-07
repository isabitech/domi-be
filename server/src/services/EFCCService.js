import EFCC from '../models/EFCC.js';
import Branch from '../models/Branch.js';
import NotificationService from './NotificationService.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';

class EFCCService {
  // Get EFCC record for today (BR view)
  static async getToday(req) {
    const branchId = req.user.role === 'BR' ? req.user.branch : req.query.branchId;

    if (!branchId) {
      throw new ValidationError('Branch ID is required');
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    let record = await EFCC.findOne({
      branch: branchId,
      date: { $gte: startOfDay, $lt: endOfDay }
    }).populate('branch', 'name code');

    // If no record exists for today, create a default one
    if (!record) {
      // Get the latest previous record to determine previousAmountOwing
      const latestRecord = await EFCC.getLatestForBranch(branchId);

      record = new EFCC({
        branch: branchId,
        date: startOfDay,
        previousAmountOwing: latestRecord ? latestRecord.currentAmountOwing : 0,
        todayRemittance: 0,
        amtRemittingNow: 0
      });

      await record.save();
      await record.populate('branch', 'name code');
    }

    return record;
  }
  static async getDate(req) {
    const branchId = req.user.role === 'BR' ? req.user.branch : req.query.branchId;

    if (!branchId) {
      throw new ValidationError('Branch ID is required');
    }

    const date = new Date(req.query.date);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    let record = await EFCC.findOne({
      branch: branchId,
      date: { $gte: startOfDay, $lt: endOfDay }
    }).populate('branch', 'name code');

    // If no record exists for today, create a default one
    if (!record) {
      // Get the latest previous record to determine previousAmountOwing
      const latestRecord = await EFCC.getLatestForBranch(branchId);

      record = new EFCC({
        branch: branchId,
        date: startOfDay,
        previousAmountOwing: latestRecord ? latestRecord.currentAmountOwing : 0,
        todayRemittance: 0,
        amtRemittingNow: 0
      });

      await record.save();
      await record.populate('branch', 'name code');
    }

    return record;
  }

  // Create or update today's EFCC record (BR only)
  static async createOrUpdate(req) {
    if (req.user.role !== 'BR') {
      throw new ForbiddenError('Only branch users can update EFCC records');
    }

    const { todayRemittance, amtRemittingNow, previousAmountOwing } = req.body;
    const branchId = req.user.branch;

    // Validate required fields
    if (todayRemittance === undefined || amtRemittingNow === undefined) {
      throw new ValidationError('todayRemittance and amtRemittingNow are required');
    }

    // Validate that amounts are non-negative
    if (todayRemittance < 0 || amtRemittingNow < 0 || (previousAmountOwing !== undefined && previousAmountOwing < 0)) {
      throw new ValidationError('Amounts cannot be negative');
    }

    const data = {
      todayRemittance: Number(todayRemittance),
      amtRemittingNow: Number(amtRemittingNow)
    };

    // Only allow previousAmountOwing to be set if it's provided
    // BR can update this value when needed
    if (previousAmountOwing !== undefined) {
      data.previousAmountOwing = Number(previousAmountOwing);
    }

    const record = await EFCC.upsertToday(branchId, data, req.user._id);
    await record.populate('branch', 'name code');

    // Send email notification to HO users and global management
    try {
      await NotificationService.sendEFCCUpdateNotification(record, req.user._id);
    } catch (emailError) {
      console.error('Failed to send EFCC update email notification:', emailError);
      // Continue execution even if email fails
    }

    return record;
  }

  // Submit today's EFCC record (BR only)
  static async submit(req) {
    if (req.user.role !== 'BR') {
      throw new ForbiddenError('Only branch users can submit EFCC records');
    }

    const branchId = req.user.branch;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const record = await EFCC.findOne({
      branch: branchId,
      date: { $gte: startOfDay, $lt: endOfDay }
    }).populate('branch', 'name code');

    if (!record) {
      throw new NotFoundError('No EFCC record found for today');
    }

    if (record.isSubmitted) {
      throw new ValidationError('EFCC record already submitted');
    }

    await record.submit(req.user._id);

    // Send submission notification to HO users and global management
    try {
      await NotificationService.sendEFCCSubmissionNotification(record, req.user._id);
    } catch (emailError) {
      console.error('Failed to send EFCC submission email notification:', emailError);
      // Continue execution even if email fails
    }

    return record;
  }

  // Get EFCC records for a specific branch (HO view)
  static async getBranchRecords(req) {
    if (!['HO', 'admin'].includes(req.user.role)) {
      throw new ForbiddenError('Only HO/admin can view branch EFCC records');
    }

    const { branchId } = req.params;
    const { startDate, endDate, limit = 30, page = 1 } = req.query;

    const query = { branch: branchId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [records, total, branch] = await Promise.all([
      EFCC.find(query)
        .populate('branch', 'name code')
        .populate('submittedBy', 'username')
        .sort({ date: -1 })
        .limit(Number(limit))
        .skip(skip),
      EFCC.countDocuments(query),
      Branch.findById(branchId, 'name code')
    ]);

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    return {
      records,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
        perPage: Number(limit)
      },
      branch
    };
  }

  // Get all branches EFCC summary (HO Dashboard)
  static async getAllBranchesSummary(req) {
    if (!['HO', 'admin'].includes(req.user.role)) {
      throw new ForbiddenError('Only HO/admin can view all branches EFCC summary');
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    // Get all branches
    const branches = await Branch.find({}, 'name code').sort({ name: 1 });

    const summary = [];

    for (const branch of branches) {
      // Get today's record for this branch
      let todayRecord = await EFCC.findOne({
        branch: branch._id,
        date: { $gte: startOfDay, $lt: endOfDay }
      }).populate('submittedBy', 'username');

      // If no record for today, get the latest record to determine current owing
      let latestRecord = null;
      if (!todayRecord) {
        latestRecord = await EFCC.getLatestForBranch(branch._id);
      }

      const branchSummary = {
        branch: {
          _id: branch._id,
          name: branch.name,
          code: branch.code
        },
        previousAmountOwing: todayRecord?.previousAmountOwing || latestRecord?.currentAmountOwing || 0,
        todayRemittance: todayRecord?.todayRemittance || 0,
        amtRemittingNow: todayRecord?.amtRemittingNow || 0,
        currentAmountOwing: todayRecord?.currentAmountOwing || latestRecord?.currentAmountOwing || 0,
        submittedAt: todayRecord?.submittedAt || null,
        submittedBy: todayRecord?.submittedBy || null,
        isSubmitted: todayRecord?.isSubmitted || false,
        hasRecord: !!todayRecord
      };

      summary.push(branchSummary);
    }

    // Calculate totals
    const totals = summary.reduce((acc, branch) => {
      acc.totalPreviousOwing += branch.previousAmountOwing;
      acc.totalTodayRemittance += branch.todayRemittance;
      acc.totalAmtRemittingNow += branch.amtRemittingNow;
      acc.totalCurrentOwing += branch.currentAmountOwing;
      return acc;
    }, {
      totalPreviousOwing: 0,
      totalTodayRemittance: 0,
      totalAmtRemittingNow: 0,
      totalCurrentOwing: 0
    });

    return {
      date: startOfDay,
      branches: summary,
      totals,
      summary: {
        totalBranches: branches.length,
        submittedToday: summary.filter(b => b.isSubmitted).length,
        pendingSubmission: summary.filter(b => !b.isSubmitted).length
      }
    };
  }

  // Get EFCC history with pagination
  static async getHistory(req) {
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    const branchId = req.user.role === 'BR' ? req.user.branch : req.query.branchId;

    if (!branchId) {
      throw new ValidationError('Branch ID is required');
    }

    // BR users can only view their own branch
    if (req.user.role === 'BR' && branchId !== req.user.branch.toString()) {
      throw new ForbiddenError('Branch users can only view their own records');
    }

    const query = { branch: branchId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      EFCC.find(query)
        .populate('branch', 'name code')
        .populate('submittedBy', 'username')
        .sort({ date: -1 })
        .limit(Number(limit))
        .skip(skip),
      EFCC.countDocuments(query)
    ]);

    return {
      records,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
        perPage: Number(limit)
      }
    };
  }
}

export default EFCCService;