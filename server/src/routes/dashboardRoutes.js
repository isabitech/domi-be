const express = require('express');
const {
  getBranchDashboard,
  getHODashboard
} = require('../controllers/dashboardController');
const { protect, authorizeBR, authorizeHO } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/branch', authorizeBR, getBranchDashboard);
router.get('/ho', authorizeHO, getHODashboard);

module.exports = router;