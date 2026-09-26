const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login/register attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false, // API hai, CSP frontend pe handle hoga
    crossOriginEmbedderPolicy: false
  }),
  mongoSanitize(), // NoSQL injection se protect
  generalLimiter
];

module.exports = {
  securityMiddleware,
  authLimiter,
  generalLimiter
};