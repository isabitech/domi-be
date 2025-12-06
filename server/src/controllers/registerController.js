import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import Branch from '../models/Branch.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';

class RegisterController {
  getLoanRegister = asyncHandler(async (req, res) => {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000);
    const branch = req.user.role === 'BR'
      ? (req.user.branch?._id || req.user.branch)
      : (branchId || req.user.branch?._id || req.user.branch);
    if (!branch) {
      throw new ValidationError('branchId is required to fetch loan register');
    }
    const lr = await LoanRegister.findOne({ branch, date: { $gte: start, $lt: end } });
    if (!lr) throw new NotFoundError('Loan register not found for date');
    success(res, { loanRegister: lr }, 'Loan register fetched');
  });

  getSavingsRegister = asyncHandler(async (req, res) => {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000);
    const branch = req.user.role === 'BR'
      ? (req.user.branch?._id || req.user.branch)
      : (branchId || req.user.branch?._id || req.user.branch);
    if (!branch) {
      throw new ValidationError('branchId is required to fetch savings register');
    }
    const sr = await SavingsRegister.findOne({ branch, date: { $gte: start, $lt: end } });
    if (!sr) throw new NotFoundError('Savings register not found for date');
    success(res, { savingsRegister: sr }, 'Savings register fetched');
  });

  updatePreviousValues = asyncHandler(async (req, res) => {
    if (!['HO','admin'].includes(req.user.role)) throw new ForbiddenError('Only HO/admin can modify previous totals');
    const { branchId, previousLoanTotal, previousSavingsTotal, loanMultiplier } = req.body;
    const update = {};
    if (previousLoanTotal !== undefined) update.previousLoanTotal = previousLoanTotal;
    if (previousSavingsTotal !== undefined) update.previousSavingsTotal = previousSavingsTotal;
    if (loanMultiplier !== undefined) update.loanMultiplier = loanMultiplier;
    const b = await Branch.findByIdAndUpdate(branchId, update, { new: true });
    if (!b) throw new NotFoundError('Branch not found');
    success(res, { branch: b }, 'Register previous values updated');
  });
}

export default new RegisterController();