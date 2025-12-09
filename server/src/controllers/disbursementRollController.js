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
    
    // Get the latest daily disbursement roll record for this branch
    let latestRoll = await DisbursementRoll.findOne({ 
      branch,
      date: { $exists: true } // Ensure we get daily records, not monthly ones
    }).sort({ date: -1 });
    
    // Fallback to monthly record if no daily records exist
    if (!latestRoll) {
      latestRoll = await DisbursementRoll.findOne({ 
        branch, 
        month: targetMonth, 
        year: targetYear 
      });
    }
    
    if (!latestRoll) {
      throw new NotFoundError('Disbursement roll not found');
    }
    
    // Only recalculate for daily records (they have the calculateCumulativeDisbursement method)
    if (latestRoll.date && !latestRoll.month) {
      // Ensure the latest record has up-to-date calculations
      await latestRoll.calculateCumulativeDisbursement();
      await latestRoll.save({ validateBeforeSave: false });
      
      // Reload to get the updated calculated values
      latestRoll = await DisbursementRoll.findById(latestRoll._id);
    }
    
    success(res, { disbursementRoll: latestRoll }, 'Disbursement roll fetched');
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