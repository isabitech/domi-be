import express from 'express';
import {
  createOrUpdateAmountNeedTomorrow,
  getAmountNeedTomorrow,
  getAmountNeedTomorrowByDate,
  getAllAmountNeedTomorrow,
  deleteAmountNeedTomorrow,
  getAmountNeedTomorrowHistory
} from '../controllers/amountNeedTomorrowController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Branch routes - require authentication
router.post('/', protect, createOrUpdateAmountNeedTomorrow);
router.get('/', protect, getAmountNeedTomorrow);
router.get('/history', protect, getAmountNeedTomorrowHistory);
router.get('/date/:date', protect, getAmountNeedTomorrowByDate);
router.delete('/:id', protect, deleteAmountNeedTomorrow);

// HO routes - require admin access
router.get('/all', protect, getAllAmountNeedTomorrow);

export default router;