import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import BankStatement1 from '../models/BankStatement1.js';
import BankStatement2 from '../models/BankStatement2.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

class BankStatementController {
  getBS1 = asyncHandler(async (req, res) => {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000);
    const branch = req.user.role === 'BR' ? req.user.branch : branchId;
    const bs1 = await BankStatement1.findOne({ branch, date: { $gte: start, $lt: end } });
    if (!bs1) throw new NotFoundError('BS1 not found');
    success(res, { bankStatement1: bs1 }, 'Bank Statement 1 fetched');
  });

  getBS2 = asyncHandler(async (req, res) => {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000);
    const branch = req.user.role === 'BR' ? req.user.branch : branchId;
    const bs2 = await BankStatement2.findOne({ branch, date: { $gte: start, $lt: end } });
    if (!bs2) throw new NotFoundError('BS2 not found');
    success(res, { bankStatement2: bs2 }, 'Bank Statement 2 fetched');
  });

  updateTBO = asyncHandler(async (req, res) => {
    if (!['HO','admin'].includes(req.user.role)) throw new ForbiddenError('Only HO/admin can update T.B.O');
    const { branchId, date, tbo, tboTargetBranch } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000);
    const bs2 = await BankStatement2.findOne({ branch: branchId, date: { $gte: start, $lt: end } });
    if (!bs2) throw new NotFoundError('BS2 not found for date');
    if (tbo !== undefined) bs2.tbo = tbo;
    if (tboTargetBranch !== undefined) bs2.tboTargetBranch = tboTargetBranch;
    await bs2.save();
    success(res, { bankStatement2: bs2 }, 'T.B.O updated');
  });
}

export default new BankStatementController();