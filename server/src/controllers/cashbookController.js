import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import CashbookService from '../services/CashbookService.js';
import { buildPaginationMeta } from '../utils/pagination.js';

// @desc    Get all cashbook entries
// @route   GET /api/cashbook
// @access  Private
class CashbookController {
  getCashbookEntries = asyncHandler(async (req, res) => {
    const { entries, total, summary, page, limit } = await CashbookService.listEntries(req);
    const pagination = buildPaginationMeta(total, page, limit);
    success(res, { entries, total, summary, pagination }, 'Cashbook entries fetched');
  });

  // @desc    Get single cashbook entry
  // @route   GET /api/cashbook/:id
  // @access  Private
  getCashbookEntry = asyncHandler(async (req, res) => {
    const entry = await CashbookService.getEntry(req);
    success(res, { entry }, 'Cashbook entry fetched');
  });

  // @desc    Create new cashbook entry
  // @route   POST /api/cashbook
  // @access  Private
  createCashbookEntry = asyncHandler(async (req, res) => {
    const entry = await CashbookService.createEntry(req);
    success(res, { entry }, 'Cashbook entry created', 201);
  });

  // @desc    Update cashbook entry
  // @route   PUT /api/cashbook/:id
  // @access  Private
  updateCashbookEntry = asyncHandler(async (req, res) => {
    const entry = await CashbookService.updateEntry(req);
    success(res, { entry }, 'Cashbook entry updated');
  });

  // @desc    Delete cashbook entry
  // @route   DELETE /api/cashbook/:id
  // @access  Private
  deleteCashbookEntry = asyncHandler(async (req, res) => {
    await CashbookService.deleteEntry(req);
    success(res, {}, 'Entry deleted');
  });

  // @desc    Approve/Reject cashbook entry
  // @route   PATCH /api/cashbook/:id/status
  // @access  Private (Manager/Admin only)
  updateEntryStatus = asyncHandler(async (req, res) => {
    const entry = await CashbookService.updateStatus(req);
    success(res, { entry }, `Entry ${entry.status}`);
  });

  // @desc    Get cashbook summary/reports
  // @route   GET /api/cashbook/reports/summary
  // @access  Private
  getCashbookSummary = asyncHandler(async (req, res) => {
    const data = await CashbookService.getSummary(req);
    success(res, data, 'Cashbook summary fetched');
  });

}

const cashbookController = new CashbookController();
export default cashbookController;