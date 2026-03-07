import User from '../models/User.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audit.js';
import { DuplicateError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import bcrypt from 'bcryptjs';


class UsersService {
  static sanitizeUser(userDoc) {
    if (!userDoc) return null;
    const plain = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete plain.password;
    return plain;
  }

  static async ensureUniqueIdentifiers(email, username, excludeId) {
    const checks = [];
    if (email) checks.push({ email: email.toLowerCase() });
    if (username) checks.push({ username });
    if (!checks.length) return;
    const query = { $or: checks };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await User.findOne(query);
    if (exists) throw new DuplicateError('User with this email or username already exists');
  }

  static async listUsers(query, actor) {
    const { page, limit, skip } = parsePagination(query);
    const filters = {};
    if (query.role) filters.role = query.role;
    if (query.status) filters.isActive = query.status === 'active';
    if (actor?.role === 'HO' && !actor?.isAdmin) {
      if (query.role === 'admin') {
        throw new ForbiddenError('HO users cannot view admin accounts');
      }
      if (!filters.role) {
        filters.role = { $ne: 'admin' };
      } else if (typeof filters.role === 'object') {
        filters.role = { ...filters.role, $ne: 'admin' };
      }
    }

    const [users, total] = await Promise.all([
      User.find(filters)
        .select('-password')
        .populate('branch', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filters)
    ]);

    return {
      users,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  static async createUser(payload, actor, reqMeta) {
    const name = payload.name?.trim();
    const username = payload.username?.trim();
    const email = payload.email?.toLowerCase();

    await UsersService.ensureUniqueIdentifiers(email, username);

    const user = await User.create({
      name,
      username,
      email,
      password: payload.password,
      role: payload.role,
      branch: payload.branchId ?? undefined
    });
    await user.populate('branch', 'name code');

    const sanitized = UsersService.sanitizeUser(user);
    logAudit({
      user: actor,
      action: AUDIT_ACTIONS.CREATE,
      resource: 'user',
      resourceId: user._id.toString(),
      oldDoc: null,
      newDoc: sanitized,
      req: reqMeta,
      extra: { branchId: sanitized.branch?.toString?.(), role: sanitized.role }
    });
    return sanitized;
  }

  
  static async updateUser(id, payload, actor, reqMeta) {
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');

    await UsersService.ensureUniqueIdentifiers(payload.email, payload.username, id);

    const updateFields = {};

    if (payload.name !== undefined) updateFields.name = payload.name.trim();
    if (payload.username !== undefined) updateFields.username = payload.username.trim();
    if (payload.email !== undefined) updateFields.email = payload.email.toLowerCase();
    if (payload.role !== undefined) updateFields.role = payload.role;
    if (payload.branchId !== undefined) updateFields.branch = payload.branchId;
    if (payload.status !== undefined) updateFields.isActive = payload.status === 'active';

    let message = 'User updated';

    if (payload.password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(payload.password, salt);
      message = 'User updated and password changed';
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
      context: 'query' // ensures validators like minlength work
    }).populate('branch', 'name code');

    const sanitized = UsersService.sanitizeUser(updatedUser);

    logAudit({
      user: actor,
      action: AUDIT_ACTIONS.UPDATE,
      resource: 'user',
      resourceId: updatedUser._id.toString(),
      oldDoc: user.toObject(),
      newDoc: sanitized,
      req: reqMeta,
      extra: {
        branchId: sanitized.branch?.toString?.(),
        role: sanitized.role
      }
    });

    sanitized.message = message;

    return sanitized;
  }

  static async deleteUser(id, actor, reqMeta) {
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const oldSnapshot = user.toObject();
    await User.findByIdAndDelete(id);
    logAudit({
      user: actor,
      action: AUDIT_ACTIONS.DELETE,
      resource: 'user',
      resourceId: user._id.toString(),
      oldDoc: oldSnapshot,
      newDoc: null,
      req: reqMeta,
      extra: { branchId: oldSnapshot.branch?.toString?.(), role: oldSnapshot.role }
    });
  }

  static async resetPassword(id, newPassword, actor, reqMeta) {
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const oldSnapshot = user.toObject();
    user.password = newPassword;
    await user.save();
    logAudit({
      user: actor,
      action: AUDIT_ACTIONS.UPDATE,
      resource: 'user_password',
      resourceId: user._id.toString(),
      oldDoc: { id: user._id.toString() },
      newDoc: { id: user._id.toString() },
      req: reqMeta,
      extra: { branchId: oldSnapshot.branch?.toString?.(), role: oldSnapshot.role }
    });
    return this.sanitizeUser(user);
  }
  static async getUserById(id) {
    const user = await User.findById(id).select('-password').populate('branch', 'name code').lean();
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}

export default UsersService;
