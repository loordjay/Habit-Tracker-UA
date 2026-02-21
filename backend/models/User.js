const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetRequired: {
    type: Boolean,
    default: false
  },
  loginHistory: [{
    date: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
  }],
  // Profile fields
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  preferences: {
    dailyReminder: { type: Boolean, default: false },
    reminderTime: { type: String, default: '09:00' },
    theme: { type: String, default: 'dark', enum: ['dark', 'light'] },
    notifications: { type: Boolean, default: true }
  },
  // Stats
  totalPoints: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output to hide sensitive fields
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Index for search
userSchema.index({ email: 'text', name: 'text' });

module.exports = mongoose.model('User', userSchema);
