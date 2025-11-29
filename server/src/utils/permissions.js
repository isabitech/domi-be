import { ForbiddenError } from '../utils/errors.js';
// Simple RBAC permission map with inheritance
// Roles assumed: employee < BR < HO < admin
const roleHierarchy = ['employee', 'BR', 'HO'];
const employeePermissions = [
  'cashbook:view',
  'cashbook:create',
  'reports:view',
  'registers:view',
  'bankstatements:view',
  'prediction:view',
  'disbursement:view'
];

const basePermissions = {
  employee: employeePermissions,
  BR: [
    ...employeePermissions,
    'dashboard:branch',
    'operations:daily:view',
    'operations:daily:modify',
    'operations:history:view',
    'prediction:modify'
  ],
  HO: [
    'reports:consolidated',
    'dashboard:ho',
    'reports:view',
    'reports:export',
    'metrics:view',
    'registers:view',
    'registers:modify',
    'bankstatements:view',
    'bankstatements:modify',
    'prediction:view',
    'disbursement:view',
    'disbursement:modify',
    'cashbook:approve',
    'cashbook:view',
    'cashbook:create',
    'branch:create',
    'branch:update',
    'branch:delete',
    'branch:toggle'
  ]
};

// Build cumulative permissions
const cumulativePermissions = {};
roleHierarchy.forEach((role, idx) => {
  const perms = new Set();
  for (let i = 0; i <= idx; i++) {
    const r = roleHierarchy[i];
    (basePermissions[r] || []).forEach(p => perms.add(p));
  }
  cumulativePermissions[role] = Array.from(perms);
});

export function hasPermission(role, permission) {
  return cumulativePermissions[role]?.includes(permission) || false;
}

export function listPermissions(role) {
  return cumulativePermissions[role] || [];
}

export function requirePermission(permission) {
  return (req, _res, next) => {
    if (req.user?.isAdmin) return next();
    if (!req.user?.role) {
      return next(new ForbiddenError('Role not found'));
    }
    if (!hasPermission(req.user.role, permission)) {
      return next(new ForbiddenError(`Missing permission: ${permission}`));
    }
    next();
  };
}

export default { hasPermission, listPermissions, requirePermission };
