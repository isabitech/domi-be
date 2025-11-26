import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import OperationsService from '../services/OperationsService.js';

// @desc    Get daily operations for a branch
// @route   GET /api/operations/daily
// @access  Private
class OperationsController {
  getDailyOperations = asyncHandler(async (req, res) => {
    const operations = await OperationsService.getDaily(req);
    success(res, { operations }, 'Data loaded');
  });

  // @desc    Create or update daily operations
  // @route   POST /api/operations/daily
  // @access  Private (BR only)
  createOrUpdateDailyOperations = asyncHandler(async (req, res) => {
    const dailyOps = await OperationsService.createOrUpdate(req);
    success(res, { dailyOps }, 'Data saved', 201);
  });

  // @desc    Submit daily operations
  // @route   PATCH /api/operations/daily/:id/submit
  // @access  Private (BR only)
  submitDailyOperations = asyncHandler(async (req, res) => {
    const dailyOps = await OperationsService.submit(req);
    success(res, { dailyOps }, 'Data submitted');
  });

  // @desc    Update HO fields
  // @route   PATCH /api/operations/ho-fields
  // @access  Private (HO only)
  updateHOFields = asyncHandler(async (req, res) => {
    const result = await OperationsService.updateHOFields(req);
    success(res, result, 'Fields updated');
  });

  // @desc    List operations history (paginated)
  // @route   GET /api/operations/history
  // @access  Private
  listHistory = asyncHandler(async (req, res) => {
    const data = await OperationsService.listHistory(req);
    success(res, data, 'History loaded');
  });
}

const operationsController = new OperationsController();
export default operationsController;