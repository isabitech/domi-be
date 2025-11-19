import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

class DisbursementRollController {
  getMonthlyRoll = asyncHandler(async (req, res) => {
    const { month, year, branchId } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const branch = req.user.role === 'BR' ? req.user.branch : branchId;
    const roll = await DisbursementRoll.findOne({ branch, month: targetMonth, year: targetYear });
    if (!roll) throw new NotFoundError('Disbursement roll not found');
    success(res, { disbursementRoll: roll }, 'Disbursement roll fetched');
  });

  updatePreviousDisbursement = asyncHandler(async (req, res) => {
    if (!['HO','admin'].includes(req.user.role)) throw new ForbiddenError('Only HO/admin can modify previous disbursement');
    const { branchId, previousDisbursement } = req.body;
    const b = await Branch.findByIdAndUpdate(branchId, { previousDisbursement }, { new: true });
    if (!b) throw new NotFoundError('Branch not found');
    success(res, { branch: b }, 'Previous disbursement updated');
  });
}

export default new DisbursementRollController();