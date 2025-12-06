import express from 'express';
import operationsController from '../controllers/operationsController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { requirePermission } from '../utils/permissions.js';
import { validate } from '../middleware/validation.js';
import { operationsSchemas } from '../validators/operationsSchemas.js';

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/daily')
  .get(requirePermission('operations:daily:view'), validate(operationsSchemas.getDaily), tryCatch(operationsController.getDailyOperations))
  .post(requirePermission('operations:daily:modify'), validate(operationsSchemas.createOrUpdate), tryCatch(operationsController.createOrUpdateDailyOperations));

router.patch('/daily/:id/submit', requirePermission('operations:daily:modify'), validate(operationsSchemas.submit), tryCatch(operationsController.submitDailyOperations));
router.patch('/ho-fields', authorizeHO, validate(operationsSchemas.updateHOFields), tryCatch(operationsController.updateHOFields));

router.get('/all', requirePermission('operations:daily:view'), tryCatch(operationsController.getAllDailyOperations));
router.get('/history', requirePermission('operations:history:view'), tryCatch(operationsController.listHistory));

export default router;