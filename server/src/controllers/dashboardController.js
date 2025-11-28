import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import { ForbiddenError, ValidationError } from '../utils/errors.js';
import DashboardService from '../services/DashboardService.js';

// DashboardController delegates data assembly to DashboardService
class DashboardController {
  // @desc Branch dashboard
  // @route GET /api/dashboard/branch
  // @access Private (BR only)
  getBranchDashboard = asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    if (req.user.role !== 'BR' && !isAdmin) {
      throw new ForbiddenError('Access denied. Branch users only.');
    }
    const branchId = req.user.role === 'BR'
      ? (req.user.branch?._id || req.user.branch)
      : (req.query.branchId || req.user.branch?._id || req.user.branch);
    if (!branchId) {
      throw new ValidationError('branchId is required to view branch dashboard');
    }
    const dashboardData = await DashboardService.branchDashboard(req, branchId);
    success(res, { dashboardData }, 'Branch dashboard fetched');
  });

  // @desc Head Office dashboard
  // @route GET /api/dashboard/ho
  // @access Private (HO only)
  getHODashboard = asyncHandler(async (req, res) => {
    if (req.user.role !== 'HO' && req.user.role !== 'admin') throw new ForbiddenError('Only HO users allowed');
    const dashboardData = await DashboardService.getHODashboard();
    success(res, { dashboardData }, 'Dashboard loaded');
  });
}

export default new DashboardController();