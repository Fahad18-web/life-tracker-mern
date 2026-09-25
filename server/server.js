const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const dotenv  = require('dotenv');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// ── Middleware ───────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ──────────────────────────────────────────
app.use('/api/auth',                require('./routes/auth'));
app.use('/api/entries',             require('./routes/entries'));
app.use('/api/analytics',           require('./routes/analytics'));
app.use('/api/habits',              require('./routes/habits'));
app.use('/api/custom-habits',       require('./routes/customHabits'));
app.use('/api/users',               require('./routes/users'));
app.use('/api/habit-replacements',  require('./routes/habitReplacements'));  // ← NEW

// ── Health Check ─────────────────────────────────────
app.get('/', (req, res) => res.json({ message: '🌿 Life Tracker API is running' }));

// ── Global Error Handler ─────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT} [${process.env.NODE_ENV}]`));