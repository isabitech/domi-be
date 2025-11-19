import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import config from './config/index.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const PORT = config.server.port;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err?.message || err}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Error: ${err?.message || err}`);
  console.error('Shutting down the server due to uncaught exception');
  process.exit(1);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('Database connection closed');
    } catch (e) {
      console.error('Error closing DB connection', e.message);
    } finally {
      process.exit(0);
    }
  });
}

['SIGINT','SIGTERM'].forEach(sig => {
  process.on(sig, () => shutdown(sig));
});