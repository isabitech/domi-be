import express from 'express';
import predictionController from '../controllers/predictionController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
const router = express.Router();
router.use(protect);
router.get('/', requirePermission('prediction:view'), predictionController.getPrediction);
router.post('/', requirePermission('prediction:modify'), predictionController.createOrUpdatePrediction);
export default router;