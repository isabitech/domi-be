import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import { ForbiddenError } from '../utils/errors.js';
import DashboardService from '../services/DashboardService.js';

// DashboardController delegates data assembly to DashboardService
class DashboardController {
  // @desc Branch dashboard
  // @route GET /api/dashboard/branch
  // @access Private (BR only)
  getBranchDashboard = asyncHandler(async (req, res) => {
    if (req.user.role !== 'BR') throw new ForbiddenError('Access denied. Branch users only.');
    const dashboardData = await DashboardService.branchDashboard(req);
    success(res, { dashboardData }, 'Branch dashboard fetched');
  });

  // @desc Head Office dashboard
  // @route GET /api/dashboard/ho
  // @access Private (HO only)
  getHODashboard = asyncHandler(async (req, res) => {
    if (req.user.role !== 'HO') throw new ForbiddenError('Access denied. Head Office users only.');
    const dashboardData = await DashboardService.hoDashboard(req);
    success(res, { dashboardData }, 'Head office dashboard fetched');
  });
}

const dashboardController = new DashboardController();
export default dashboardController;