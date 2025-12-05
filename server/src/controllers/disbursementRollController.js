import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import Branch from '../models/Branch.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

class DisbursementRollController {
  // Get latest disbursement roll for branch (now daily-based)
  getMonthlyRoll = asyncHandler(async (req, res) => {
    const { branchId } = req.query;
    const branch = req.user.role === 'BR' ? req.user.branch : branchId;
    
    // Get the latest disbursement roll entry for this branch
    let roll = await DisbursementRoll.findOne({ branch }).sort({ date: -1 });
    
    if (roll) {
      // Ensure it has up-to-date cumulative calculations
      await roll.calculateCumulativeDisbursement();
      await roll.save({ validateBeforeSave: false });
      // Reload to get updated values
      roll = await DisbursementRoll.findById(roll._id);
    }
    
    if (!roll) throw new NotFoundError('Disbursement roll not found');
    success(res, { disbursementRoll: roll }, 'Disbursement roll fetched');
  });

  updatePreviousDisbursement = asyncHandler(async (req, res) => {
    if (!['HO','admin'].includes(req.user.role)) throw new ForbiddenError('Only HO/admin can modify previous disbursement');
    const { branchId, previousDisbursement, previousDisbursementRollNo } = req.body;
    
    const updates = {};
    if (previousDisbursement !== undefined) updates.previousDisbursement = previousDisbursement;
    if (previousDisbursementRollNo !== undefined) updates.previousDisbursementRollNo = previousDisbursementRollNo;
    
    const b = await Branch.findByIdAndUpdate(branchId, updates, { new: true });
    if (!b) throw new NotFoundError('Branch not found');
    
    // Recalculate all disbursement roll entries for this branch
    const earliestEntry = await DisbursementRoll.findOne({ branch: branchId }).sort({ date: 1 });
    if (earliestEntry) {
      await DisbursementRoll.recalculateFromDate(branchId, earliestEntry.date);
    }
    
    success(res, { branch: b }, 'Previous disbursement updated and recalculated');
  });

  // Migration endpoint to clean up old records
  migrate = asyncHandler(async (req, res) => {
    // Allow any authenticated user to run migration
    // if (!['HO', 'admin'].includes(req.user.role)) {
    //   throw new ForbiddenError('Only HO/admin can run migration');
    // }

    const records = await DisbursementRoll.find({});
    let updatedCount = 0;

    for (const record of records) {
      let needsUpdate = false;

      // Check if record has old schema structure or needs field cleanup
      // Force migration for all records to ensure proper field structure
      const originalRecord = record.toObject();
      
      // Ensure dailyDisNo exists and has proper value
      if (record.dailyDisNo === undefined || record.dailyDisNo === null) {
        record.dailyDisNo = 0;
        needsUpdate = true;
      }

      // Handle field migration and cleanup
      if (originalRecord.hasOwnProperty('currentDisbursementNo')) {
        // Transfer value if needed
        if (record.dailyDisNo === 0 && originalRecord.currentDisbursementNo > 0) {
          record.dailyDisNo = originalRecord.currentDisbursementNo;
        }
        // Remove the old field
        record.set('currentDisbursementNo', undefined, { strict: false });
        needsUpdate = true;
      }

      if (originalRecord.hasOwnProperty('cumulativeDisNo')) {
        // Remove the old field
        record.set('cumulativeDisNo', undefined, { strict: false });
        needsUpdate = true;
      }

      // Force recalculation for all records to ensure consistency
      const oldDisbursementRoll = record.disbursementRoll;
      const oldDisNo = record.disNo;
      
      await record.calculateCumulativeDisbursement();
      
      // Check if values changed after recalculation
      if (record.disbursementRoll !== oldDisbursementRoll || record.disNo !== oldDisNo) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        try {
          await record.save({ validateBeforeSave: false });
          updatedCount++;
          console.log(`Updated record ${record._id}: dailyDisNo=${record.dailyDisNo}, disbursementRoll=${record.disbursementRoll}, disNo=${record.disNo}`);
        } catch (error) {
          console.error(`Error updating record ${record._id}:`, error.message);
        }
      }
    }

    success(res, {
      totalRecords: records.length,
      updatedRecords: updatedCount,
      message: 'Disbursement roll migration completed'
    }, 'Migration successful');
  });
}

export default new DisbursementRollController();