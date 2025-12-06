import express from 'express';
import branchController from '../controllers/branchController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import { validate } from '../middleware/validation.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { branchSchemas } from '../validators/branchSchemas.js';

const router = express.Router();

router.use(protect); // All routes are protected

router
  .route('/')
  .get(validate(branchSchemas.list), tryCatch(branchController.getBranches))
  .post(requirePermission('branch:create'), validate(branchSchemas.create), tryCatch(branchController.createBranch));

router
  .route('/:id')
  .get(validate(branchSchemas.get), tryCatch(branchController.getBranch))
  .put(requirePermission('branch:update'), validate(branchSchemas.update), tryCatch(branchController.updateBranch))
  .delete(requirePermission('branch:delete'), validate(branchSchemas.delete), tryCatch(branchController.deleteBranch));

router.patch('/:id/toggle-status', requirePermission('branch:toggle'), validate(branchSchemas.toggleStatus), tryCatch(branchController.toggleBranchStatus));

export default router;