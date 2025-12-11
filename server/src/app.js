import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import logger from './utils/logger.js';
import authRoutes from './routes/authRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import cashbookRoutes from './routes/cashbookRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import registerRoutes from './routes/registerRoutes.js';
import bankStatementRoutes from './routes/bankStatementRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import amountNeedTomorrowRoutes from './routes/amountNeedTomorrowRoutes.js';
import disbursementRollRoutes from './routes/disbursementRollRoutes.js';
import efccRoutes from './routes/efccRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import reportsCompatibilityRoutes from './routes/reportsCompatibilityRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import { listPermissions, requirePermission } from './utils/permissions.js';
import errorHandler from './middleware/errorHandler.js';
import { success, failure } from './utils/response.js';
import { NotFoundError } from './utils/errors.js';
import config from './config/index.js';

// Initialize express
const app = express();
// Simple in-memory metrics
const metrics = { startTime: Date.now(), requestCount: 0, errorCount: 0 };

// Request counter
app.use((req, _res, next) => {
  metrics.requestCount++;
  next();
});

// Security middleware
app.use(helmet());
app.set('trust proxy', 1); // trust first proxy


// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Sanitization: use sanitize helper to mutate objects instead of replacing req.query
app.use((req, _res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      try {
        // sanitize in-place when possible
        if (typeof mongoSanitize.sanitize === 'function') {
          mongoSanitize.sanitize(req[key]);
        }
      } catch (e) {
        // fallback: sanitize a cloned object and assign if writable
        try {
          const cloned = JSON.parse(JSON.stringify(req[key]));
          const sanitized = typeof mongoSanitize.sanitize === 'function' ? mongoSanitize.sanitize(cloned) : cloned;
          try { req[key] = sanitized; } catch (_) { /* ignore if property is read-only */ }
        } catch (_) {
          // ignore serialization or assignment failures
        }
      }
    }
  });
  next();
});

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: msg => logger.info(msg.trim()) }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Per-endpoint rate limiters
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many auth requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const reportsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: req => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false
});

// Audit logs specific limiter (stricter: protect expensive queries)
const auditLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // allow 20 audit queries per minute per user/IP
  keyGenerator: req => req.user?.id || req.ip,
  message: 'Too many audit log requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

// CORS
app.use(cors({
  // origin: config.client.url,
  origin: '*',
  // credentials: true
}));

const API_PREFIX = config.server.apiPrefix;

// Mount routes
app.use(`${API_PREFIX}/branches`, branchRoutes);
app.use(`${API_PREFIX}/cashbook`, cashbookRoutes);
app.use(`${API_PREFIX}/operations`, operationsRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/reports`, reportsLimiter, reportsRoutes);
app.use(`${API_PREFIX}/reports`, reportsCompatibilityRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/registers`, registerRoutes);
app.use(`${API_PREFIX}/bank-statements`, bankStatementRoutes);
app.use(`${API_PREFIX}/prediction`, predictionRoutes);
app.use(`${API_PREFIX}/amount-need-tomorrow`, amountNeedTomorrowRoutes);
app.use(`${API_PREFIX}/disbursement-roll`, disbursementRollRoutes);
app.use(`${API_PREFIX}/efcc`, efccRoutes);
app.use(`${API_PREFIX}/metrics`, metricsRoutes);
app.use(`${API_PREFIX}/audit-logs`, auditLimiter, auditRoutes);

// Health check
app.get(`${API_PREFIX}/health`, (req, res) => {
  success(res, {
    version: config.server.version,
    environment: config.env
  }, 'Operations Management System API is running!');
});

// Permissions listing
app.get(`${API_PREFIX}/permissions`, (req, res) => {
  const roles = ['employee', 'BR', 'manager', 'HO', 'admin'];
  const map = roles.map(role => ({
    role,
    permissions: listPermissions(role)
  }));
  success(res, { permissions: map }, 'Permissions loaded');
});

// Metrics endpoint
app.get(`${API_PREFIX}/system-metrics`,
  requirePermission('metrics:view'),
  (req, res) => {
    success(res, {
      uptimeMs: Date.now() - metrics.startTime,
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      environment: config.env,
      version: config.server.version
    }, 'System metrics');
  }
);

// Catch unknown routes
app.use((req, res) => {
  failure(res, new NotFoundError('Page not found'));
});

// Error handler — increments error count
app.use((err, req, res, next) => {
  if (err) metrics.errorCount++;
  errorHandler(err, req, res, next);
});

export default app;
