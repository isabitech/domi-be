import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import EFCCService from '../services/EFCCService.js';

class EFCCController {
  // @desc    Get today's EFCC record for branch
  // @route   GET /api/efcc/today
  // @access  Private (BR/HO)
  getTodayRecord = asyncHandler(async (req, res) => {
    const record = await EFCCService.getToday(req);
    success(res, { efcc: record }, 'Today\'s EFCC record fetched');
  });

  // @desc    Create or update today's EFCC record
  // @route   POST /api/efcc/today
  // @access  Private (BR only)
  createOrUpdateToday = asyncHandler(async (req, res) => {
    const record = await EFCCService.createOrUpdate(req);
    success(res, { efcc: record }, 'EFCC record saved', 201);
  });

  // @desc    Submit today's EFCC record
  // @route   PATCH /api/efcc/today/submit
  // @access  Private (BR only)
  submitToday = asyncHandler(async (req, res) => {
    const record = await EFCCService.submit(req);
    success(res, { efcc: record }, 'EFCC record submitted');
  });

  // @desc    Get EFCC records for a specific branch
  // @route   GET /api/efcc/branch/:branchId
  // @access  Private (HO/admin only)
  getBranchRecords = asyncHandler(async (req, res) => {
    const data = await EFCCService.getBranchRecords(req);
    success(res, data, 'Branch EFCC records fetched');
  });

  // @desc    Get all branches EFCC summary (HO Dashboard)
  // @route   GET /api/efcc/summary/all-branches
  // @access  Private (HO/admin only)
  getAllBranchesSummary = asyncHandler(async (req, res) => {
    const summary = await EFCCService.getAllBranchesSummary(req);
    success(res, summary, 'All branches EFCC summary fetched');
  });

  // @desc    Get EFCC history with pagination
  // @route   GET /api/efcc/history
  // @access  Private
  getHistory = asyncHandler(async (req, res) => {
    const data = await EFCCService.getHistory(req);
    success(res, data, 'EFCC history fetched');
  });
}

export default new EFCCController();