const Branch = require('../models/Branch');
const User = require('../models/User');

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private
const getBranches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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

    res.json({
      success: true,
      count: branches.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Private
const getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager', 'name email');
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new branch
// @route   POST /api/branches
// @access  Private (Admin only)
const createBranch = async (req, res) => {
  try {
    const { name, code, address, phone, email, manager } = req.body;

    // Check if branch with same name or code exists
    const existingBranch = await Branch.findOne({
      $or: [{ name }, { code }]
    });

    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: 'Branch with this name or code already exists'
      });
    }

    // If manager is provided, verify the user exists and is eligible
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: 'Manager user not found'
        });
      }
    }

    const branch = await Branch.create({
      name,
      code,
      address,
      phone,
      email,
      manager
    });

    await branch.populate('manager', 'name email');

    res.status(201).json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Admin only)
const updateBranch = async (req, res) => {
  try {
    const { name, code, address, phone, email, manager } = req.body;

    let branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if another branch has the same name or code
    if (name || code) {
      const existingBranch = await Branch.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(name ? [{ name }] : []),
          ...(code ? [{ code }] : [])
        ]
      });

      if (existingBranch) {
        return res.status(400).json({
          success: false,
          message: 'Branch with this name or code already exists'
        });
      }
    }

    // If manager is being updated, verify the user exists
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: 'Manager user not found'
        });
      }
    }

    branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { name, code, address, phone, email, manager },
      { new: true, runValidators: true }
    ).populate('manager', 'name email');

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Admin only)
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if there are users associated with this branch
    const usersCount = await User.countDocuments({ branch: req.params.id });
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch with associated users'
      });
    }

    await Branch.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle branch status
// @route   PATCH /api/branches/:id/toggle-status
// @access  Private (Admin only)
const toggleBranchStatus = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    branch.isActive = !branch.isActive;
    await branch.save();

    res.json({
      success: true,
      message: `Branch ${branch.isActive ? 'activated' : 'deactivated'} successfully`,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus
};