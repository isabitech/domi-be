const express = require('express');
const {
  getCashbookEntries,
  getCashbookEntry,
  createCashbookEntry,
  updateCashbookEntry,
  deleteCashbookEntry,
  updateEntryStatus,
  getCashbookSummary
} = require('../controllers/cashbookController');
const { protect, authorizeHO } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/')
  .get(getCashbookEntries)
  .post(createCashbookEntry);

router.get('/reports/summary', getCashbookSummary);

router
  .route('/:id')
  .get(getCashbookEntry)
  .put(updateCashbookEntry)
  .delete(deleteCashbookEntry);

router.patch('/:id/status', authorizeHO, updateEntryStatus);

module.exports = router;