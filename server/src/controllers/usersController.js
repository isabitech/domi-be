import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { success } from '../utils/response.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audit.js';
import { NotFoundError, DuplicateError, ValidationError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

class UsersController {
  list = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.status) query.isActive = req.query.status === 'active';

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    success(res, { users, pagination: buildPaginationMeta(total, page, limit) }, 'Users fetched');
  });

  create = asyncHandler(async (req, res) => {
    const {name, username, email, password, role, branchId } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) throw new DuplicateError('User with this email or username already exists');

    const user = await User.create({ name, username, email, password, role, branch: branchId });
    const out = user.toObject();
    delete out.password;
    logAudit({
      user: req.user,
      action: AUDIT_ACTIONS.CREATE,
      resource: 'user',
      resourceId: user._id.toString(),
      oldDoc: null,
      newDoc: out,
      req,
      extra: { branchId: out.branch?.toString?.(), role: out.role }
    });
    success(res, { user: out }, 'User created', 201);
  });

  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payload = req.body;

    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const oldSnapshot = user.toObject();

    if (payload.username || payload.email) {
      const existing = await User.findOne({
        _id: { $ne: id },
        $or: [ ...(payload.username ? [{ username: payload.username }] : []), ...(payload.email ? [{ email: payload.email }] : []) ]
      });
      if (existing) throw new DuplicateError('Username or email already in use');
    }

    Object.assign(user, {
      name: payload.username || user.name,
      username: payload.username || user.username,
      email: payload.email || user.email,
      role: payload.role || user.role,
      branch: payload.branchId !== undefined ? payload.branchId : user.branch,
      isActive: payload.status ? payload.status === 'active' : user.isActive
    });

    await user.save();
    const out = user.toObject(); delete out.password;
    logAudit({
      user: req.user,
      action: AUDIT_ACTIONS.UPDATE,
      resource: 'user',
      resourceId: user._id.toString(),
      oldDoc: oldSnapshot,
      newDoc: out,
      req,
      extra: { branchId: out.branch?.toString?.(), role: out.role }
    });
    success(res, { user: out }, 'User updated');
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const oldSnapshot = user.toObject();
    await User.findByIdAndDelete(id);
    logAudit({
      user: req.user,
      action: AUDIT_ACTIONS.DELETE,
      resource: 'user',
      resourceId: user._id.toString(),
      oldDoc: oldSnapshot,
      newDoc: null,
      req,
      extra: { branchId: oldSnapshot.branch?.toString?.(), role: oldSnapshot.role }
    });
    success(res, {}, 'User deleted');
  });
}

export default new UsersController();
