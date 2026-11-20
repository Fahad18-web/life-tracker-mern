
'use strict';

const config = require('../config');
const logger = require('../utils/logger');

const INTERNAL_SERVER_ERROR = 'Internal Server Error';

const isValidStatusCode = (statusCode) => {
  return (
    Number.isInteger(statusCode) &&
    statusCode >= 400 &&
    statusCode <= 599
  );
};

const getSafeClientMessage = (err, statusCode) => {
  // Never expose internal server errors in production.
  if (statusCode >= 500 && !config.isDev) {
    return INTERNAL_SERVER_ERROR;
  }

  if (err.name === 'CastError') {
    return 'Resource not found';
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];

    return field
      ? `${field} already exists`
      : 'Duplicate resource';
  }

  if (err.name === 'ValidationError') {
    return Object.values(err.errors || {})
      .map((error) => error.message)
      .join(', ') || 'Validation failed';
  }

  if (err.name === 'JsonWebTokenError') {
    return 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    return 'Token expired';
  }

  if (err.name === 'NotBeforeError') {
    return 'Token not active';
  }

  return err.message || INTERNAL_SERVER_ERROR;
};

const errorHandler = (err, req, res, next) => {
  // Headers may already have been sent by another middleware.
  // Delegate to Express instead of attempting another response.
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;

  // Invalid or unsafe HTTP status codes must become 500.
  if (!isValidStatusCode(statusCode)) {
    statusCode = 500;
  }

  const message = getSafeClientMessage(err, statusCode);

  // Never include query strings in error logs.
  const requestPath = req.path || '/';

  const logMetadata = {
    path: requestPath,
    method: req.method,
    statusCode
  };

  if (statusCode >= 500) {
    logger.error(message, {
      ...logMetadata,
      stack: err.stack
    });
  } else {
    logger.warn(message, logMetadata);
  }

  const response = {
    success: false,
    message
  };

  // Stack traces are available only in development.
  if (config.isDev && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
