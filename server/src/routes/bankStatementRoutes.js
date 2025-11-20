import express from 'express';
import bankStatementController from '../controllers/bankStatementController.js';
import { protect } from '../middleware/auth.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { requirePermission } from '../utils/permissions.js';
const router = express.Router();
router.use(protect);
router.get('/bs1', requirePermission('bankstatements:view'), tryCatch(bankStatementController.getBS1));
router.get('/bs2', requirePermission('bankstatements:view'), tryCatch(bankStatementController.getBS2));
router.patch('/bs2/tbo', requirePermission('bankstatements:modify'), tryCatch(bankStatementController.updateTBO));
export default router