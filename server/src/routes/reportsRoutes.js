const express = require('express');
const {
  getDailyReport,
  getMonthlyReport,
  getConsolidatedReport,
  getCustomReport
} = require('../controllers/reportsController');
const { protect, authorizeHO } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/consolidated', authorizeHO, getConsolidatedReport);
router.get('/custom', getCustomReport);

module.exports = router;