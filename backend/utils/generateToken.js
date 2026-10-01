const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * @param {string} id - user id
 * @param {boolean} [rememberMe=false]
 */
const generateToken = (id, rememberMe = false) => {
  const expiresIn = rememberMe
    ? process.env.JWT_EXPIRES_REMEMBER || '14d'
    : process.env.JWT_EXPIRES_SESSION || '12h';

  return jwt.sign({ id }, config.jwt.secret, { expiresIn });
};

module.exports = generateToken;