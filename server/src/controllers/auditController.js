import { asyncHandler } from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.js';
import { success } from '../utils/response.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

class AuditController {
  list = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const query = {};
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) query.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.timestamp.$lte = new Date(req.query.endDate);
    }
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.action) query.action = req.query.action;

    const results = await AuditLog.find(query).skip(skip).limit(limit).sort({ timestamp: -1 });
    const total = await AuditLog.countDocuments(query);
    success(res, { results, pagination: buildPaginationMeta(total, page, limit) }, 'Audit logs fetched');
  });
}

export default new AuditController();
