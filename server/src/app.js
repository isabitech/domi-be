import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import morgan from 'morgan';
import logger from './utils/logger.js';
import authRoutes from './routes/authRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import cashbookRoutes from './routes/cashbookRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import registerRoutes from './routes/registerRoutes.js';
import bankStatementRoutes from './routes/bankStatementRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import disbursementRollRoutes from './routes/disbursementRollRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import { listPermissions, requirePermission } from './utils/permissions.js';
import errorHandler from './middleware/errorHandler.js';
import { success, failure } from './utils/response.js';
import config from './config/index.js';

// Initialize express first
const app = express();

// Simple in-memory metrics (reset on restart)
const metrics = { startTime: Date.now(), requestCount: 0, errorCount: 0 };

// Request counter middleware (after app defined)
app.use((req, _res, next) => { metrics.requestCount++; next(); });

// Security & parsing middleware
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize());
app.use(xss());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Enable CORS
app.use(cors({
  origin: config.client.url,
  credentials: true
}));

// API version prefix
const API_PREFIX = config.server.apiPrefix;

// Mount routers
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/branches`, branchRoutes);
app.use(`${API_PREFIX}/cashbook`, cashbookRoutes);
app.use(`${API_PREFIX}/operations`, operationsRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/registers`, registerRoutes);
app.use(`${API_PREFIX}/bank-statements`, bankStatementRoutes);
app.use(`${API_PREFIX}/prediction`, predictionRoutes);
app.use(`${API_PREFIX}/disbursement-roll`, disbursementRollRoutes);
app.use(`${API_PREFIX}/metrics`, metricsRoutes);

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  success(res, {
    version: config.server.version,
    environment: config.env
  }, 'Operations Management System API is running!');
});

// Permissions listing (debug/admin use)
app.get(`${API_PREFIX}/permissions`, (req, res) => {
  const roles = ['employee','BR','manager','HO','admin'];
  const map = roles.map(r => ({ role: r, permissions: listPermissions(r) }));
  success(res, { permissions: map }, 'Permissions listing');
});

// Metrics endpoint (HO/admin only)
// Legacy base metrics (system) endpoint retained under /system-metrics (HO/admin only)
app.get(`${API_PREFIX}/system-metrics`, requirePermission('metrics:view'), (req, res) => {
  success(res, {
    uptimeMs: Date.now() - metrics.startTime,
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    environment: config.env,
    version: config.server.version
  }, 'System metrics');
});

// Handle unhandled routes (must be after all mounted/metrics)
app.use((req, res) => {
  failure(res, 'Route not found', 404);
});

// Error handler middleware (must be last) - increment errorCount on error
app.use((err, req, res, next) => { if (err) metrics.errorCount++; errorHandler(err, req, res, next); });

export default app;