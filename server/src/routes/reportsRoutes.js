import express from 'express';
import rateLimit from 'express-rate-limit';
import reportsController from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import { validate } from '../middleware/validation.js';
import { reportSchemas } from '../validators/reportSchemas.js';
import { tryCatch } from '../utils/asyncHandler.js';

const router = express.Router();

// Export-specific limiter (5 requests/min per user)
const exportLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	keyGenerator: (req) => req.user?.id || req.ip,
	standardHeaders: true,
	legacyHeaders: false
});

router.use(protect); // All routes are protected

router.get('/daily', requirePermission('reports:view'), validate(reportSchemas.daily), tryCatch(reportsController.getDailyReport));
router.get('/daily/export', requirePermission('reports:export'), validate(reportSchemas.daily), exportLimiter, tryCatch(reportsController.exportDailyReport));
router.get('/monthly', requirePermission('reports:view'), validate(reportSchemas.monthly), tryCatch(reportsController.getMonthlyReport));
router.get('/monthly/export', requirePermission('reports:export'), validate(reportSchemas.monthly), exportLimiter, tryCatch(reportsController.exportMonthlyReport));
router.get('/consolidated', requirePermission('reports:consolidated'), validate(reportSchemas.consolidated), tryCatch(reportsController.getConsolidatedReport));
router.get('/consolidated/export', requirePermission('reports:export'), validate(reportSchemas.consolidated), exportLimiter, tryCatch(reportsController.exportConsolidatedReport));
router.get('/custom', requirePermission('reports:view'), validate(reportSchemas.custom), tryCatch(reportsController.getCustomReport));
router.get('/custom/export', requirePermission('reports:export'), validate(reportSchemas.custom), exportLimiter, tryCatch(reportsController.exportCustomReport));

export default router;