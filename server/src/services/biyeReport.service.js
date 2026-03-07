import BiyeReport from '../models/biyeReport.model.js';
import { ValidationError, DuplicateError } from '../utils/errors.js';

class BiyeReportService {
    /**
     * Create a new BIYE report
     * @param {Object} data - Report data
     * @returns {Promise<Object>} Created report
     */
    async createBiyeReport(data) {
        const {
            amountToClients,
            ajoWithdrawalAmount,
            totalClients,
            ldSolvedToday,
            clientsThatPaidToday,
            branch
        } = data;

        if (ldSolvedToday + clientsThatPaidToday > totalClients) {
            throw new ValidationError(
                'The sum of LD solved today and clients that paid today cannot exceed total clients'
            );
        }

        const totalAmountNeeded =
            (amountToClients || 0) + (ajoWithdrawalAmount || 0);

        const currentLDNo =
            (totalClients || 0) -
            (ldSolvedToday || 0) -
            (clientsThatPaidToday || 0);

        // Normalize reportDate to start of today
        const reportDate = new Date();
        reportDate.setHours(0, 0, 0, 0);

        try {
            const report = await BiyeReport.create({
                ...data,
                branch,
                reportDate,
                totalAmountNeeded,
                currentLDNo
            });

            return report;
        } catch (error) {
            if (error.code === 11000) {
                throw new DuplicateError(
                    'A BIYE report has already been submitted for this branch today'
                );
            }
            throw error;
        }
    }

    /**
     * Get reports for a specific branch
     * @param {String} branchId - Branch ID
     * @returns {Promise<Array>} List of reports
     */
    async getBranchReports(branchId) {
        return await BiyeReport.find({ branch: branchId }).sort({ reportDate: -1 });
    }

    /**
     * Get Head Office report with filters
     * @param {Object} filters - Search filters (startDate, endDate, branchId)
     * @returns {Promise<Array>} Aggregated reports
     */
    async getHOReport(filters = {}) {
        const query = {};

        if (filters.branchId) {
            query.branch = filters.branchId;
        }

        if (filters.startDate || filters.endDate) {
            query.reportDate = {};
            if (filters.startDate) query.reportDate.$gte = new Date(filters.startDate);
            if (filters.endDate) query.reportDate.$lte = new Date(filters.endDate);
        }

        // Return populated reports to see branch details
        return await BiyeReport.find(query)
            .populate('branch', 'name')
            .sort({ reportDate: -1, branch: 1 });
    }
    async getTodayReportByBranch(branchId, startDate = null, endDate = null) {
        let start;
        let end;

        if (startDate && endDate) {
            const startTarget = new Date(startDate);
            const endTarget = new Date(endDate);

            if (isNaN(startTarget.getTime()) || isNaN(endTarget.getTime())) {
                throw new ValidationError(
                    "Invalid date format. Use YYYY-MM-DD for startDate and endDate"
                );
            }

            start = new Date(startTarget);
            start.setHours(0, 0, 0, 0);

            end = new Date(endTarget);
            end.setHours(23, 59, 59, 999);
        } else if (startDate || endDate) {
            throw new ValidationError(
                "Both startDate and endDate must be provided together"
            );
        } else {
            // default: today
            start = new Date();
            start.setHours(0, 0, 0, 0);

            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

        return BiyeReport.find({
            branch: branchId,
            reportDate: {
                $gte: start,
                $lte: end
            }
        });
    }

}

export default new BiyeReportService();
