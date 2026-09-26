const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');

connectDB();

const app = express();

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

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🌿 Life Tracker API is running',
    env: config.env
  });
});

// Global error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`✅ Server running on port ${config.port} [${config.env}]`);
});