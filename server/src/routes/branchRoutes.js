const express = require('express');
const {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus
} = require('../controllers/branchController');
const { protect, authorizeHO } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/')
  .get(getBranches)
  .post(authorizeHO, createBranch);

router
  .route('/:id')
  .get(getBranch)
  .put(authorizeHO, updateBranch)
  .delete(authorizeHO, deleteBranch);

router.patch('/:id/toggle-status', authorizeHO, toggleBranchStatus);

module.exports = router;