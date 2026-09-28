require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production'
};

// Basic validation
const required = ['mongoUri', 'jwt.secret'];
const missing = required.filter(key => {
  const value = key.split('.').reduce((obj, k) => obj?.[k], config);
  return !value;
});

if (missing.length > 0) {
  console.error(`❌ Missing required env variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = config;