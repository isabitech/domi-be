const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const cashbookRoutes = require('./routes/cashbookRoutes');
const operationsRoutes = require('./routes/operationsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/cashbook', cashbookRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Operations Management System API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle unhandled routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;