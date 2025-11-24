import AuditLog from '../models/AuditLog.js';

// Action constants to standardize usage across services.
export const AUDIT_ACTIONS = Object.freeze({
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS: 'STATUS_UPDATE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PERMISSION: 'PERMISSION_CHANGE'
});

// Mask sensitive fields before logging (extendable).
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken'];
function maskSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? obj.map(v => maskSensitive(v)) : { ...obj };
  Object.keys(clone).forEach(k => {
    if (SENSITIVE_FIELDS.includes(k)) clone[k] = '[REDACTED]';
    else if (typeof clone[k] === 'object') clone[k] = maskSensitive(clone[k]);
  });
  return clone;
}

// Compute a diff between old and new objects (shallow + nested keys up to 2 levels).
function diffObjects(oldObj, newObj) {
  if (!oldObj || !newObj) return null;
  const changed = {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of keys) {
    const before = oldObj[key];
    const after = newObj[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changed[key] = { before, after };
    }
  }
  return Object.keys(changed).length ? changed : null;
}

// Core single audit entry creator.
export async function logAudit({
  user,
  action,
  resource,
  resourceId,
  oldDoc = null,
  newDoc = null,
  req,
  extra = null,
  enableDiff = true
}) {
  try {
    const oldValue = maskSensitive(oldDoc);
    const newValue = maskSensitive(newDoc);
    const diff = enableDiff ? diffObjects(oldValue, newValue) : null;
    await AuditLog.create({
      userId: user?._id || user?.id,
      username: user?.username,
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      diff,
      meta: extra || undefined
    });
  } catch (_) {
    // Never block business logic.
  }
}

// Batch logging for multiple resources (e.g. bulk updates).
export async function logAuditBatch(entries = []) {
  if (!Array.isArray(entries) || !entries.length) return;
  try {
    const docs = entries.map(e => ({
      userId: e.user?._id || e.user?.id,
      username: e.user?.username,
      action: e.action,
      resource: e.resource,
      resourceId: e.resourceId,
      oldValue: maskSensitive(e.oldDoc),
      newValue: maskSensitive(e.newDoc),
      ipAddress: e.req?.ip,
      userAgent: e.req?.headers?.['user-agent'],
      diff: e.enableDiff === false ? null : diffObjects(maskSensitive(e.oldDoc), maskSensitive(e.newDoc)),
      meta: e.extra || undefined
    }));
    await AuditLog.insertMany(docs, { ordered: false });
  } catch (_) {
    // Swallow errors
  }
}

// Query helper with filtering & pagination.
export async function fetchAuditLogs({
  userId,
  resource,
  action,
  page = 1,
  limit = 25,
  startDate,
  endDate
}) {
  const q = {};
  if (userId) q.userId = userId;
  if (resource) q.resource = resource;
  if (action) q.action = action;
  if (startDate || endDate) {
    q.createdAt = {};
    if (startDate) q.createdAt.$gte = new Date(startDate);
    if (endDate) q.createdAt.$lte = new Date(endDate);
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(q)
  ]);
  return { items, total, page, limit };
}

export default { logAudit, logAuditBatch, fetchAuditLogs, AUDIT_ACTIONS }; 
