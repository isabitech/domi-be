import Cashbook from '../models/Cashbook.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

class CashbookService {
  static async listEntries(req) {
    const { parsePagination, buildPaginationMeta } = await import('../utils/pagination.js');
    const { page, limit, skip } = parsePagination(req.query);

    let query = {};
    if (req.user.role === 'employee') query.user = req.user.id;
    else if (req.user.role === 'manager') query.branch = req.user.branch;

    if (req.query.type) query.type = req.query.type;
    if (req.query.category) query.category = { $regex: req.query.category, $options: 'i' };
    if (req.query.status) query.status = req.query.status;
    if (req.query.branch) query.branch = req.query.branch;

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
    }

    if (req.query.search) query.description = { $regex: req.query.search, $options: 'i' };

    const entries = await Cashbook.find(query)
      .populate('user', 'name email')
      .populate('branch', 'name code')
      .populate('approvedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, createdAt: -1 });

    const total = await Cashbook.countDocuments(query);

    const summaryAgg = await Cashbook.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          netAmount: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', { $multiply: ['$amount', -1] }] } }
        }
      }
    ]);

    return { entries, total, summary: summaryAgg[0], pagination: buildPaginationMeta(total, page, limit) };
  }

  static async getEntry(req) {
    const entry = await Cashbook.findById(req.params.id)
      .populate('user', 'name email')
      .populate('branch', 'name code')
      .populate('approvedBy', 'name email');
    if (!entry) throw new NotFoundError('Cashbook entry not found');

    if (req.user.role === 'employee' && entry.user.toString() !== req.user.id) {
      throw new ForbiddenError('Not authorized to view this entry');
    }
    if (req.user.role === 'manager' && entry.branch.toString() !== req.user.branch.toString()) {
      throw new ForbiddenError('Not authorized to view this entry');
    }
    return entry;
  }

  static async createEntry(req) {
    const { type, category, description, amount, paymentMethod, reference, date, notes } = req.body;
    if (!type || !category || !description || amount == null) {
      throw new ValidationError('type, category, description and amount are required');
    }
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
    return entry;
  }

  static async updateEntry(req) {
    let entry = await Cashbook.findById(req.params.id);
    if (!entry) throw new NotFoundError('Cashbook entry not found');
    if (entry.user.toString() !== req.user.id) throw new ForbiddenError('Not authorized to edit this entry');
    if (entry.status === 'approved') throw new ValidationError('Cannot edit approved entries');

    const { type, category, description, amount, paymentMethod, reference, date, notes } = req.body;

    entry = await Cashbook.findByIdAndUpdate(
      req.params.id,
      { type, category, description, amount, paymentMethod, reference, date, notes, status: 'pending' },
      { new: true, runValidators: true }
    ).populate([
      { path: 'user', select: 'name email' },
      { path: 'branch', select: 'name code' }
    ]);
    return entry;
  }

  static async deleteEntry(req) {
    const entry = await Cashbook.findById(req.params.id);
    if (!entry) throw new NotFoundError('Cashbook entry not found');

    const canDelete =
      req.user.role === 'admin' ||
      (req.user.role === 'manager' && entry.branch.toString() === req.user.branch.toString()) ||
      (entry.user.toString() === req.user.id && entry.status === 'pending');
    if (!canDelete) throw new ForbiddenError('Not authorized to delete this entry');

    await Cashbook.findByIdAndDelete(req.params.id);
  }

  static async updateStatus(req) {
    const { status, notes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      throw new ValidationError('Status must be either approved or rejected');
    }
    const entry = await Cashbook.findById(req.params.id);
    if (!entry) throw new NotFoundError('Cashbook entry not found');

    const canApprove =
      req.user.role === 'admin' ||
      (req.user.role === 'manager' && entry.branch.toString() === req.user.branch.toString());
    if (!canApprove) throw new ForbiddenError('Not authorized to approve/reject this entry');

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
    return entry;
  }

  static async getSummary(req) {
    let query = {};
    if (req.user.role === 'employee') query.user = req.user.id;
    else if (req.user.role === 'manager') query.branch = req.user.branch;

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
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          pendingEntries: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approvedEntries: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedEntries: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    const categoryBreakdown = await Cashbook.aggregate([
      { $match: query },
      { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.type': 1, total: -1 } }
    ]);

    return {
      summary: summary[0] || {
        totalIncome: 0,
        totalExpense: 0,
        pendingEntries: 0,
        approvedEntries: 0,
        rejectedEntries: 0
      },
      categoryBreakdown,
      netAmount: (summary[0]?.totalIncome || 0) - (summary[0]?.totalExpense || 0)
    };
  }
}

export default CashbookService;
