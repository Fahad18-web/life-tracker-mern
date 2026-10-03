const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');

connectDB();

const app = express();

// Production reverse proxy (Render / Railway / Nginx)
if (config.isProd) {
  app.set('trust proxy', 1);
}

// Security middlewares
app.use(securityMiddleware);

// CORS
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/custom-habits', require('./routes/customHabits'));
app.use('/api/users', require('./routes/users'));
app.use('/api/habit-replacements', require('./routes/habitReplacements'));
app.use('/api/cron', require('./routes/cron'));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🌿 Life Tracker API is running',
    env: config.env
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, ok: true, env: config.env });
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

app.listen(config.port, () => {
  console.log(`✅ Server running on port ${config.port} [${config.env}]`);
});