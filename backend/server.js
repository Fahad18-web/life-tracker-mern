
'use strict';

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');
const corsOptions = require('./middleware/corsOptions');

const app = express();
const server = http.createServer(app);

let isShuttingDown = false;

// Production reverse proxy (Render / Railway / Nginx)
if (config.isProd) {
  app.set('trust proxy', 1);
}

// Security middlewares
app.use(securityMiddleware);

// CORS
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/rituals', require('./routes/rituals'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/custom-habits', require('./routes/customHabits'));
app.use('/api/users', require('./routes/users'));
app.use('/api/habit-replacements', require('./routes/habitReplacements'));
app.use('/api/weekly-reviews', require('./routes/weeklyReviews'));
app.use('/api/cron', require('./routes/cron'));
app.use('/api/push', require('./routes/push'));

// Liveness check: confirms the application process is running.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    ok: true,
    env: config.env
  });
});

// Readiness check: confirms MongoDB is connected.
app.get('/api/ready', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;

  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    ready: databaseReady,
    database: databaseReady ? 'connected' : 'disconnected',
    env: config.env
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Life Tracker API is running',
    env: config.env
  });
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };

    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(config.port);
  });

  console.log(`Server running on port ${config.port} [${config.env}]`);
};


const closeHttpServer = () => {
  return new Promise((resolve, reject) => {
    if (!server.listening) {
      return resolve();
    }

    const forceCloseTimer = setTimeout(() => {
      console.error(
        'Shutdown timeout reached. Closing remaining HTTP connections.'
      );
      server.closeAllConnections();
    }, 10000);

    server.close((error) => {
      clearTimeout(forceCloseTimer);

      if (error) {
        return reject(error);
      }

      resolve();
    });

    server.closeIdleConnections();
  });
};


const shutdown = async (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  console.log(`${signal} received. Starting graceful shutdown...`);

  let disconnectTimer;

  try {
    console.log('[Shutdown] Closing HTTP server...');
    await closeHttpServer();
    console.log('[Shutdown] HTTP server closed.');

    console.log(
      '[Shutdown] MongoDB state before disconnect:',
      mongoose.connection.readyState
    );

    console.log('[Shutdown] Disconnecting MongoDB...');

  await mongoose.disconnect()

    console.log(
      '[Shutdown] MongoDB state after disconnect:',
      mongoose.connection.readyState
    );

    console.log('Graceful shutdown completed.');
    process.exitCode = 0;
  } catch (error) {
    console.error('Graceful shutdown failed:', error.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(disconnectTimer);
  }
};



process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer().catch(async (error) => {
  console.error('Server startup failed:', error.message);

  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error('MongoDB cleanup failed:', disconnectError.message);
  }

  process.exitCode = 1;
});
