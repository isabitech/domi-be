import express from 'express';
import { protect } from '../middleware/auth.js';
import migrationController from '../controllers/migrationController.js';

const router = express.Router();

// POST /api/v1/migration/disbursement-roll - Migrate disbursement roll records
router.post('/disbursement-roll', protect, migrationController.migrateDisbursementRoll);

export default router;