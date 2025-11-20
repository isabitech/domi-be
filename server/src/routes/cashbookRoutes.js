import express from 'express';
import cashbookController from '../controllers/cashbookController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import { validate } from '../middleware/validation.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { cashbookSchemas } from '../validators/cashbookSchemas.js';

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/')
  .get(requirePermission('cashbook:view'), validate(cashbookSchemas.list), tryCatch(cashbookController.getCashbookEntries))
  .post(requirePermission('cashbook:create'), validate(cashbookSchemas.create), tryCatch(cashbookController.createCashbookEntry));

router.get('/reports/summary', requirePermission('cashbook:view'), validate(cashbookSchemas.summary), tryCatch(cashbookController.getCashbookSummary));

// Compatibility route per spec: GET /cashbook/:branchId/:date
router.get('/:branchId/:date', requirePermission('cashbook:view'), async (req, res, next) => {
  try {
    const { branchId, date } = req.params;
    // clone request to avoid mutating possible read-only req.query
    const clonedReq = Object.assign({}, req, { query: Object.assign({}, req.query, { branch: branchId, startDate: date, endDate: date }) });
    return  cashbookController.getCashbookEntries(clonedReq, res, next);
  } catch (err) {
    next(err);
  }
});

router
  .route('/:id')
  .get(requirePermission('cashbook:view'), validate(cashbookSchemas.get), tryCatch(cashbookController.getCashbookEntry))
  .put(requirePermission('cashbook:create'), validate(cashbookSchemas.update), tryCatch(cashbookController.updateCashbookEntry))
  .delete(requirePermission('cashbook:create'), validate(cashbookSchemas.delete), tryCatch(cashbookController.deleteCashbookEntry));

router.patch('/:id/status', requirePermission('cashbook:approve'), validate(cashbookSchemas.updateStatus), tryCatch(cashbookController.updateEntryStatus));

export default router;