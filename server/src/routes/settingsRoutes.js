import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { settingsSchemas } from '../validators/settingsSchemas.js';

const router = express.Router();

router.use(protect);
router.use(authorizeHO);

router.get('/system', settingsController.getSystem);
router.put('/system', validate(settingsSchemas.system), tryCatch(settingsController.updateSystem));

router.get('/financial', settingsController.getFinancial);
router.put('/financial', validate(settingsSchemas.financial), tryCatch(settingsController.updateFinancial));

router.get('/security',     tryCatch(settingsController.getSecurity));
router.put('/security', validate(settingsSchemas.security), tryCatch(settingsController.updateSecurity));

router.get('/notifications', tryCatch(settingsController.getNotifications));
router.put('/notifications', validate(settingsSchemas.notifications), tryCatch(settingsController.updateNotifications));
export default router;
