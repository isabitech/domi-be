import express from 'express';
import { protect } from '../middleware/auth.js';
import { getOnlineCIHTSODaily } from '../controllers/metricsController.js';
import { tryCatch } from '../utils/asyncHandler.js';
const router = express.Router();

router.use(protect);

// All authenticated roles can view; branch role sees only its own branch data
router.get('/online-cih-tso', tryCatch(getOnlineCIHTSODaily));

export default router;