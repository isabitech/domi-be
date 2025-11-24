import { asyncHandler } from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.js';
import { success } from '../utils/response.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { ForbiddenError, AuthError } from '../utils/errors.js';

class AuditController {
  list = asyncHandler(async (req, res) => {
    // Explicit auth presence check (defensive even with protect middleware)
    if (!req.user) throw new AuthError('Not authenticated');
    const { page, limit, skip } = parsePagination(req.query);
    const query = {};
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) query.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.timestamp.$lte = new Date(req.query.endDate);
    }
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.action) query.action = req.query.action;
    if (req.query.resource) query.resource = req.query.resource;

    // Branch user restriction: can only view their own user logs or their branch meta
    if (req.user.role === 'BR') {
      // enforce restriction
      const branchId = req.user.branch?._id || req.user.branch;
      query.$or = [
        { userId: req.user._id || req.user.id },
        { 'meta.branchId': branchId?.toString?.() }
      ];
      // If explicit userId filter doesn't match their own, forbid
      if (req.query.userId && req.query.userId !== (req.user._id?.toString() || req.user.id?.toString())) {
        throw new ForbiddenError('Cannot view other users audit logs');
      }
    }

    const results = await AuditLog.find(query).skip(skip).limit(limit).sort({ timestamp: -1 });
    const total = await AuditLog.countDocuments(query);
    success(res, { results, pagination: buildPaginationMeta(total, page, limit) }, 'Audit logs fetched');
  });
}

export default new AuditController();
