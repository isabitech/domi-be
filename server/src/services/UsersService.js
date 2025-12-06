import User from '../models/User.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audit.js';
import { DuplicateError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

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
    const oldSnapshot = user.toObject();

    await UsersService.ensureUniqueIdentifiers(payload.email, payload.username, id);

    if (payload.name !== undefined) user.name = payload.name.trim();
    if (payload.username !== undefined) user.username = payload.username.trim();
    if (payload.email !== undefined) user.email = payload.email.toLowerCase();
    if (payload.role !== undefined) user.role = payload.role;
    if (payload.branchId !== undefined) user.branch = payload.branchId;
    if (payload.status !== undefined) user.isActive = payload.status === 'active';

    await user.save();
    await user.populate('branch', 'name code');
    const sanitized = UsersService.sanitizeUser(user);
    logAudit({
      user: actor,
      action: AUDIT_ACTIONS.UPDATE,
      resource: 'user',
      resourceId: user._id.toString(),
      oldDoc: oldSnapshot,
      newDoc: sanitized,
      req: reqMeta,
      extra: { branchId: sanitized.branch?.toString?.(), role: sanitized.role }
    });
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
}

export default UsersService;
