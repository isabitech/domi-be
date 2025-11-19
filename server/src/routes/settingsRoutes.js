import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { settingsSchemas } from '../validators/settingsSchemas.js';

const router = express.Router();

router.use(protect);
router.use(authorizeHO);

router.get('/system', settingsController.getSystem);
router.put('/system', validate(settingsSchemas.system), settingsController.updateSystem);

router.get('/financial', settingsController.getFinancial);
router.put('/financial', validate(settingsSchemas.financial), settingsController.updateFinancial);

router.get('/security', settingsController.getSecurity);
router.put('/security', validate(settingsSchemas.security), settingsController.updateSecurity);

router.get('/notifications', settingsController.getNotifications);
router.put('/notifications', validate(settingsSchemas.notifications), settingsController.updateNotifications);

export default router;
