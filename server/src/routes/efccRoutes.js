import express from 'express';
import efccController from '../controllers/efccController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { efccSchemas } from '../validators/efccValidator.js';
import { tryCatch } from '../utils/asyncHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/efcc/today
// @desc    Get today's EFCC record for branch
// @access  Private (BR/HO)
router.get('/today', validate(efccSchemas.query), tryCatch(efccController.getTodayRecord));

// @route   GET /api/efcc/date
// @desc    Get EFCC record for a specific date
// @access  Private (BR/HO)
router.get('/date', validate(efccSchemas.query), tryCatch(efccController.getDateRecord));

// @route   POST /api/efcc/today
// @desc    Create or update today's EFCC record
// @access  Private (BR only)
router.post('/today', validate(efccSchemas.createOrUpdate), tryCatch(efccController.createOrUpdateToday));

// @route   PATCH /api/efcc/today/submit
// @desc    Submit today's EFCC record
// @access  Private (BR only)
router.patch('/today/submit', tryCatch(efccController.submitToday));

// @route   GET /api/efcc/summary/all-branches
// @desc    Get all branches EFCC summary (HO Dashboard)
// @access  Private (HO/admin only)
router.get('/summary/all-branches', validate(efccSchemas.query), tryCatch(efccController.getAllBranchesSummary));

// @route   GET /api/efcc/branch/:branchId
// @desc    Get EFCC records for a specific branch
// @access  Private (HO/admin only)
router.get('/branch/:branchId', validate(efccSchemas.branchId), validate(efccSchemas.query), tryCatch(efccController.getBranchRecords));

// @route   GET /api/efcc/history
// @desc    Get EFCC history with pagination
// @access  Private
router.get('/history', validate(efccSchemas.query), tryCatch(efccController.getHistory));

export default router;