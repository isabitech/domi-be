const express = require('express');
const {
  getDailyOperations,
  createOrUpdateDailyOperations,
  submitDailyOperations,
  updateHOFields
} = require('../controllers/operationsController');
const { protect, authorizeBR, authorizeHO } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/daily')
  .get(getDailyOperations)
  .post(authorizeBR, createOrUpdateDailyOperations);

router.patch('/daily/:id/submit', authorizeBR, submitDailyOperations);
router.patch('/ho-fields', authorizeHO, updateHOFields);

module.exports = router;