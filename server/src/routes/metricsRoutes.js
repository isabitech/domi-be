import express from 'express';
import { protect } from '../middleware/auth.js';
import { getOnlineCIHTSODaily } from '../controllers/metricsController.js';

const router = express.Router();

router.use(protect);

// All authenticated roles can view; branch role sees only its own branch data
router.get('/online-cih-tso', getOnlineCIHTSODaily);

export default router;