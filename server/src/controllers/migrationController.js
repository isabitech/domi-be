import DisbursementRoll from '../models/DisbursementRoll.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import { ForbiddenError } from '../utils/errors.js';

class MigrationController {
  migrateDisbursementRoll = asyncHandler(async (req, res) => {
    if (!['HO', 'admin'].includes(req.user.role)) {
      throw new ForbiddenError('Only HO/admin can run migration');
    }

    const records = await DisbursementRoll.find({});
    let updatedCount = 0;

    for (const record of records) {
      let needsUpdate = false;

      if (record.currentDisbursementNo !== undefined || record.cumulativeDisNo !== undefined) {
        if (record.currentDisbursementNo !== undefined && record.dailyDisNo === undefined) {
          record.dailyDisNo = record.currentDisbursementNo;
          needsUpdate = true;
        }

        if (record.dailyDisNo === undefined) {
          record.dailyDisNo = 0;
          needsUpdate = true;
        }

        record.currentDisbursementNo = undefined;
        record.cumulativeDisNo = undefined;
        needsUpdate = true;
      }

      if (record.dailyDisNo === undefined) {
        record.dailyDisNo = 0;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await record.save();
        updatedCount++;
      }
    }

    success(res, {
      totalRecords: records.length,
      updatedRecords: updatedCount,
      message: 'Disbursement roll migration completed'
    }, 'Migration successful');
  });
}

export default new MigrationController();