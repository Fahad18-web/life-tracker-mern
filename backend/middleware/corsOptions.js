
const config = require('../config');

const allowedOrigins = new Set(config.corsOrigins);

/**
 * Express CORS origin policy.
 *
 * Requests without an Origin header are allowed for
 * server-to-server tools and command-line clients.
 *
 * Untrusted browser origins receive no CORS permission.
 * CORS is not a replacement for authentication or authorization.
 */
function origin(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }

  return callback(null, allowedOrigins.has(origin));
}

const corsOptions = {
  origin,
  credentials: true
};

module.exports = corsOptions;
