import Branch from '../models/Branch.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import { NotFoundError, DuplicateError, ValidationError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

class BranchController {
  // @desc    Get all branches
  // @route   GET /api/v1/branches
  // @access  Private
  getBranches = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);

    const query = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { code: { $regex: req.query.search, $options: 'i' } }
          ]
        }
      : {};

    const branches = await Branch.find(query)
      .populate('manager', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const total = await Branch.countDocuments(query);

    success(res, {
      count: branches.length,
      total,
      pagination: buildPaginationMeta(total, page, limit),
      branches
    }, 'Branches fetched');
  });

  // @desc    Get single branch
  // @route   GET /api/v1/branches/:id
  // @access  Private
  getBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id).populate('manager', 'name email');
    if (!branch) throw new NotFoundError('Branch not found');
    success(res, { branch }, 'Branch fetched');
  });

  // @desc    Create new branch
  // @route   POST /api/v1/branches
  // @access  Private (Admin / permission based)
  createBranch = asyncHandler(async (req, res) => {
    const { name, code, address, phone, email, manager } = req.body; // validated by middleware
    const existingBranch = await Branch.findOne({ $or: [{ name }, { code }] });
    if (existingBranch) throw new DuplicateError('Branch with this name or code already exists');
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) throw new ValidationError('Manager user not found');
    }
    const branch = await Branch.create({ name, code, address, phone, email, manager });
    await branch.populate('manager', 'name email');
    success(res, { branch }, 'Branch created', 201);
  });

  // @desc    Update branch
  // @route   PUT /api/v1/branches/:id
  // @access  Private (Admin / permission based)
  updateBranch = asyncHandler(async (req, res) => {
    const { name, code, address, phone, email, manager } = req.body;
    let branch = await Branch.findById(req.params.id);
    if (!branch) throw new NotFoundError('Branch not found');
    if (name || code) {
      const existingBranch = await Branch.findOne({
        _id: { $ne: req.params.id },
        $or: [ ...(name ? [{ name }] : []), ...(code ? [{ code }] : []) ]
      });
      if (existingBranch) throw new DuplicateError('Branch with this name or code already exists');
    }
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) throw new ValidationError('Manager user not found');
    }
    branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { name, code, address, phone, email, manager },
      { new: true, runValidators: true }
    ).populate('manager', 'name email');
    success(res, { branch }, 'Branch updated');
  });

  // @desc    Delete branch
  // @route   DELETE /api/v1/branches/:id
  // @access  Private (Admin / permission based)
  deleteBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);
    if (!branch) throw new NotFoundError('Branch not found');
    const usersCount = await User.countDocuments({ branch: req.params.id });
    if (usersCount > 0) throw new ValidationError('Cannot delete branch with associated users');
    await Branch.findByIdAndDelete(req.params.id);
    success(res, {}, 'Branch deleted');
  });

  // @desc    Toggle branch status
  // @route   PATCH /api/v1/branches/:id/toggle-status
  // @access  Private (Admin / permission based)
  toggleBranchStatus = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);
    if (!branch) throw new NotFoundError('Branch not found');
    branch.isActive = !branch.isActive;
    await branch.save();
    success(res, { branch }, `Branch ${branch.isActive ? 'activated' : 'deactivated'}`);
  });
}

const branchController = new BranchController();
export default branchController;