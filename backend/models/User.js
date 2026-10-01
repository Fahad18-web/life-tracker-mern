const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [60, 'Name cannot exceed 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  timezone: {
    type: String,
    default: 'Asia/Karachi'
  },
  avatar: {
    type: String,
    default: null,
    maxlength: [32, 'Avatar id too long'],
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },

  subscription: {
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    validUntil: { type: Date }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    themePreset: {
      type: String,
      enum: ['teal', 'ocean', 'sunset', 'forest', 'violet'],
      default: 'teal'
    },
    customHabits: {
      type: [{
        key: { type: String, required: true },
        name: { type: String, required: true, trim: true, maxlength: 40 },
        category: { type: String, enum: ['good', 'bad'], required: true }
      }],
      default: []
    }
  }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);