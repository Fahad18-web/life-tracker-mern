const { body } = require('express-validator');
const { MIN_LENGTH } = require('../utils/passwordPolicy');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 60 }).withMessage('Name cannot exceed 60 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: MIN_LENGTH })
    .withMessage(`Password must be at least ${MIN_LENGTH} characters`)
    .matches(/[a-zA-Z]/)
    .withMessage('Password must include at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must include at least one number')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  registerValidation,
  loginValidation
};