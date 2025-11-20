import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validation.js';
import { dashboardSchemas } from '../validators/dashboardSchemas.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/branch', requirePermission('dashboard:branch'), validate(dashboardSchemas.branch), tryCatch(dashboardController.getBranchDashboard));
router.get('/ho', requirePermission('dashboard:ho'), validate(dashboardSchemas.ho), tryCatch(dashboardController.getHODashboard));

export default router;