import express from 'express';
import reportsController from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import { validate } from '../middleware/validation.js';
import { reportSchemas } from '../validators/reportSchemas.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/daily', requirePermission('reports:view'), validate(reportSchemas.daily), reportsController.getDailyReport);
router.get('/daily/export', requirePermission('reports:export'), validate(reportSchemas.daily), reportsController.exportDailyReport);
router.get('/monthly', requirePermission('reports:view'), validate(reportSchemas.monthly), reportsController.getMonthlyReport);
router.get('/monthly/export', requirePermission('reports:export'), validate(reportSchemas.monthly), reportsController.exportMonthlyReport);
router.get('/consolidated', requirePermission('reports:consolidated'), validate(reportSchemas.consolidated), reportsController.getConsolidatedReport);
router.get('/consolidated/export', requirePermission('reports:export'), validate(reportSchemas.consolidated), reportsController.exportConsolidatedReport);
router.get('/custom', requirePermission('reports:view'), validate(reportSchemas.custom), reportsController.getCustomReport);
router.get('/custom/export', requirePermission('reports:export'), validate(reportSchemas.custom), reportsController.exportCustomReport);

export default router;