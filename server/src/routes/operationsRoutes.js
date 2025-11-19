import express from 'express';
import operationsController from '../controllers/operationsController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import { validate } from '../middleware/validation.js';
import { operationsSchemas } from '../validators/operationsSchemas.js';

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/daily')
  .get(requirePermission('operations:daily:view'), validate(operationsSchemas.getDaily), operationsController.getDailyOperations)
  .post(requirePermission('operations:daily:modify'), validate(operationsSchemas.createOrUpdate), operationsController.createOrUpdateDailyOperations);

router.patch('/daily/:id/submit', requirePermission('operations:daily:modify'), validate(operationsSchemas.submit), operationsController.submitDailyOperations);
router.patch('/ho-fields', authorizeHO, validate(operationsSchemas.updateHOFields), operationsController.updateHOFields);

router.get('/history', requirePermission('operations:history:view'), operationsController.listHistory);

export default router;