import DailyOperations from '../models/DailyOperations.js';
import Branch from '../models/Branch.js';
import { ValidationError } from '../utils/errors.js';

class MetricsService {
  // Build date range for a single day
  static buildDateRange(dateStr) {
    const target = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(target.getTime())) throw new ValidationError('Invalid date provided');
    const start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  // Query filter considering role
  static buildQuery(req, range) {
    const base = { date: { $gte: range.start, $lt: range.end } };
    if (req.user.role === 'BR') return { ...base, branch: req.user.branch }; // branch user restricted
    return base; // others can view all branches; optional branchId param
  }

  // Aggregate metrics per branch for the day
  static async aggregateOnlineCIHandTSO(query) {
    return DailyOperations.aggregate([
      { $match: query },
      { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
      { $unwind: '$branchInfo' },
      { $group: { _id: '$branch', branchName: { $first: '$branchInfo.name' }, branchCode: { $first: '$branchInfo.code' }, onlineCIH: { $sum: '$onlineCIH' }, tso: { $sum: '$tso' } } },
      { $sort: { branchName: 1 } }
    ]);
  }

  // Fetch raw operations for completeness (optional detail list)
  static async fetchRawOperations(query) {
    return DailyOperations.find(query).populate({ path: 'branch', select: 'name code' }).select('onlineCIH tso branch date');
  }

  // Build response object
  static buildResponse(req, range, aggregated, raw) {
    const totals = aggregated.reduce((acc, b) => {
      acc.totalOnlineCIH += b.onlineCIH || 0;
      acc.totalTSO += b.tso || 0;
      return acc;
    }, { totalOnlineCIH: 0, totalTSO: 0 });

    return {
      date: range.start,
      generatedAt: new Date(),
      generatedBy: req.user.name,
      metrics: aggregated.map(b => ({
        branch: { id: b._id, name: b.branchName, code: b.branchCode },
        onlineCIH: b.onlineCIH,
        tso: b.tso
      })),
      totals: { ...totals, branchCount: aggregated.length },
      raw: raw.map(r => ({ branch: { id: r.branch._id, name: r.branch.name, code: r.branch.code }, onlineCIH: r.onlineCIH, tso: r.tso, date: r.date }))
    };
  }

  static async dailyOnlineCIHTSO(req) {
    const { date } = req.query;
    const range = MetricsService.buildDateRange(date);
    const query = MetricsService.buildQuery(req, range);
    const aggregated = await MetricsService.aggregateOnlineCIHandTSO(query);
    const raw = await MetricsService.fetchRawOperations(query);
    return MetricsService.buildResponse(req, range, aggregated, raw);
  }
}

export default MetricsService;