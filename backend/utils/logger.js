
'use strict';

const config = require('../config');

const SENSITIVE_KEY_PATTERN =
  /password|passwd|token|secret|authorization|cookie|api[-_]?key|access[-_]?key|private[-_]?key|credential|auth|reset[-_]?token|refresh[-_]?token|otp|email|endpoint|subscription|p256dh|clientkey/i;

const MAX_DEPTH = 6;
const MAX_ARRAY_LENGTH = 50;
const MAX_STRING_LENGTH = 2000;

const REDACTED = '[REDACTED]';
const CIRCULAR = '[Circular]';
const MAX_LOG_META_KEYS = 100;

const sanitizeString = (value) => {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]`;
};

const sanitizeValue = (value, depth = 0, seen = new WeakSet()) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  if (depth >= MAX_DEPTH) {
    return '[MaxDepth]';
  }

  if (seen.has(value)) {
    return CIRCULAR;
  }

  seen.add(value);

  if (value instanceof Error) {
    const sanitizedError = {
      name: value.name,
      message: sanitizeString(value.message || ''),
    };

    if (config.isDev && value.stack) {
      sanitizedError.stack = sanitizeString(value.stack);
    }

    for (const key of Object.keys(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitizedError[key] = REDACTED;
        continue;
      }

      if (key === 'stack') {
        if (config.isDev) {
          sanitizedError.stack = sanitizeString(value.stack || '');
        }
        continue;
      }

      sanitizedError[key] = sanitizeValue(
        value[key],
        depth + 1,
        seen
      );
    }

    return sanitizedError;
  }

  if (Array.isArray(value)) {
    const sanitizedArray = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeValue(item, depth + 1, seen));

    if (value.length > MAX_ARRAY_LENGTH) {
      sanitizedArray.push('[ArrayTruncated]');
    }

    return sanitizedArray;
  }

  const sanitizedObject = {};
  const keys = Object.keys(value).slice(0, MAX_LOG_META_KEYS);

  for (const key of keys) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitizedObject[key] = REDACTED;
      continue;
    }

    sanitizedObject[key] = sanitizeValue(
      value[key],
      depth + 1,
      seen
    );
  }

  if (Object.keys(value).length > MAX_LOG_META_KEYS) {
    sanitizedObject._truncated = true;
  }

  return sanitizedObject;
};

const writeLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();

  const safeMessage = sanitizeString(
    typeof message === 'string' ? message : String(message)
  );

  const safeMeta = sanitizeValue(meta);

  // Reserved fields are written last to prevent metadata overwriting them.
  const logEntry = {
    ...(safeMeta && typeof safeMeta === 'object' && !Array.isArray(safeMeta)
      ? safeMeta
      : { meta: safeMeta }),
    timestamp,
    level,
    message: safeMessage
  };

  const output = JSON.stringify(logEntry);

  switch (level) {
    case 'error':
      console.error(output);
      break;

    case 'warn':
      console.warn(output);
      break;

    case 'debug':
      if (config.isDev) {
        console.log(output);
      }
      break;

    default:
      console.log(output);
  }
};

const logger = {
  info: (message, meta) => writeLog('info', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  debug: (message, meta) => {
    if (config.isDev) {
      writeLog('debug', message, meta);
    }
  }
};

module.exports = logger;
