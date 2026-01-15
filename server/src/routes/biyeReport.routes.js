import express from 'express';
import BiyeReportController from '../controllers/biyeReport.controller.js';
import { protect, authorizeHO, authorizeBR } from '../middleware/auth.js';
import { tryCatch } from 'src/utils/asyncHandler.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/v1/biye-reports
 * @desc    Submit a daily BIYE report
 * @access  Branch only
 */
router.post('/', protect, authorizeBR, tryCatch(BiyeReportController.create));

/**
 * @route   GET /api/v1/biye-reports/ho
 * @desc    Get all reports (with filters)
 * @access  Head Office only
 */
router.get('/ho', protect, authorizeHO, tryCatch(BiyeReportController.getHOReport));

/**
 * @route   GET /api/v1/biye-reports/branch/:branchId
 * @desc    Get reports for a specific branch
 * @access  Branch (self) or Head Office
 */
router.get('/branch/:branchId', protect, tryCatch(BiyeReportController.getBranchReports));

export default router;
