import express from 'express';
import cashbookController from '../controllers/cashbookController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import { validate } from '../middleware/validation.js';
import { cashbookSchemas } from '../validators/cashbookSchemas.js';

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/')
  .get(requirePermission('cashbook:view'), validate(cashbookSchemas.list), cashbookController.getCashbookEntries)
  .post(requirePermission('cashbook:create'), validate(cashbookSchemas.create), cashbookController.createCashbookEntry);

router.get('/reports/summary', requirePermission('cashbook:view'), validate(cashbookSchemas.summary), cashbookController.getCashbookSummary);

router
  .route('/:id')
  .get(requirePermission('cashbook:view'), validate(cashbookSchemas.get), cashbookController.getCashbookEntry)
  .put(requirePermission('cashbook:create'), validate(cashbookSchemas.update), cashbookController.updateCashbookEntry)
  .delete(requirePermission('cashbook:create'), validate(cashbookSchemas.delete), cashbookController.deleteCashbookEntry);

router.patch('/:id/status', requirePermission('cashbook:approve'), validate(cashbookSchemas.updateStatus), cashbookController.updateEntryStatus);

export default router;