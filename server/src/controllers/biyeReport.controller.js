import BiyeReportService from '../services/biyeReport.service.js';
import { success, failure } from '../utils/response.js';
import { ForbiddenError } from '../utils/errors.js';

class BiyeReportController {
    /**
     * Create a BIYE report (Branch only)
     */
    async create(req, res) {
        // Ensure branch is taken from the user's session/token if they are a BR role
        const data = {
            ...req.body,
            branch: req.user.role === 'BR' ? req.user.branch._id : req.body.branch
        };

        const report = await BiyeReportService.createBiyeReport(data);
        success(res, report, 'BIYE report submitted successfully', 201);
    }

    /**
     * Get reports for specific branch
     */
    async getBranchReports(req, res) {

        const { branchId } = req.params;

        // Authorization check: BR can only see their own branch, HO can see any
        if (req.user.role === 'BR' && req.user.branch._id.toString() !== branchId) {
            throw new ForbiddenError('You are not authorized to view reports for another branch');
        }

        const reports = await BiyeReportService.getBranchReports(branchId);
        success(res, reports, 'Branch BIYE reports retrieved successfully');
    }

    /**
     * Get Head Office overview (HO only)
     */
    async getHOReport(req, res) {
        const { startDate, endDate, branchId } = req.query;
        const reports = await BiyeReportService.getHOReport({ startDate, endDate, branchId });
        success(res, reports, 'BIYE reports overview retrieved successfully');

    }
}

export default new BiyeReportController();
