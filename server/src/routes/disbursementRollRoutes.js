import express from 'express';
import disbursementRollController from '../controllers/disbursementRollController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
const router = express.Router();
router.use(protect);
router.get('/', requirePermission('disbursement:view'), disbursementRollController.getMonthlyRoll);
router.patch('/previous', requirePermission('disbursement:modify'), disbursementRollController.updatePreviousDisbursement);
export default router;