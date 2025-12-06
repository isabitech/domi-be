import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import BranchService from '../services/BranchService.js';

class BranchController {
  // @desc    Get all branches
  // @route   GET /api/v1/branches
  // @access  Private
  getBranches = asyncHandler(async (req, res) => {
    const result = await BranchService.listBranches(req.query);
    success(res, result, 'Branches fetched');
  });

  // @desc    Get single branch
  // @route   GET /api/v1/branches/:id
  // @access  Private
  getBranch = asyncHandler(async (req, res) => {
    const branch = await BranchService.getBranchById(req.params.id);
    success(res, { branch }, 'Branch fetched');
  });

  // @desc    Create new branch
  // @route   POST /api/v1/branches
  // @access  Private (Admin / permission based)
  createBranch = asyncHandler(async (req, res) => {
    const branch = await BranchService.createBranch(req.body, req.user, req);
    success(res, { branch }, 'Branch created', 201);
  });

  // @desc    Update branch
  // @route   PUT /api/v1/branches/:id
  // @access  Private (Admin / permission based)
  updateBranch = asyncHandler(async (req, res) => {
    const branch = await BranchService.updateBranch(req.params.id, req.body, req.user, req);
    success(res, { branch }, 'Branch updated');
  });

  // @desc    Delete branch
  // @route   DELETE /api/v1/branches/:id
  // @access  Private (Admin / permission based)
  deleteBranch = asyncHandler(async (req, res) => {
    await BranchService.deleteBranch(req.params.id, req.user, req);
    success(res, {}, 'Branch deleted');
  });

  // @desc    Toggle branch status
  // @route   PATCH /api/v1/branches/:id/toggle-status
  // @access  Private (Admin / permission based)
  toggleBranchStatus = asyncHandler(async (req, res) => {
    const branch = await BranchService.toggleStatus(req.params.id, req.user, req);
    success(res, { branch }, `Branch ${branch.isActive ? 'activated' : 'deactivated'}`);
  });
}

const branchController = new BranchController();
export default branchController;