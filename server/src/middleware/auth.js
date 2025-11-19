import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthError, ForbiddenError } from '../utils/errors.js';

// Protect routes
export const protect = async (req, _res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AuthError('Not authorized: missing token'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).populate('branch');

    if (!req.user || !req.user.isActive) {
      return next(new AuthError('User not found or inactive'));
    }

    next();
  } catch (error) {
    return next(new AuthError('Not authorized: invalid or expired token'));
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} not authorized for this route`));
    }
    next();
  };
};

// HO only access
export const authorizeHO = (req, _res, next) => {
  if (req.user.role !== 'HO') {
    return next(new ForbiddenError('Access denied: Head Office users only'));
  }
  next();
};

// BR only access
export const authorizeBR = (req, _res, next) => {
  if (req.user.role !== 'BR') {
    return next(new ForbiddenError('Access denied: Branch users only'));
  }
  next();
};