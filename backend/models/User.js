const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Define the user schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'shopowner', 'storevendor'], // Removed 'user' and kept only the three roles
    default: 'storevendor' // Default to 'storevendor' if not provided
  },
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  shopName: { 
    type: String, 
    required: function() { return this.role === 'shopowner'; }, // Only required for shopowners
    trim: true 
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, { timestamps: true });

// Hash password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(12); // Changed from 10 to 12 for consistency
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare input password with the stored hashed password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  // Different token expiration times based on role
  let expiresIn = '12h'; // Default for shopowner and storevendor
  
  // Admins get longer expiration time - 6 days
  if (this.role === 'admin') {
    expiresIn = '6d';
  }
  
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role,
      // Add a unique identifier to prevent token reuse
      jti: crypto.randomBytes(16).toString('hex')
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: expiresIn, // Role-based token lifetime
      issuer: 'smart-pos-system',
      audience: 'pos-users'
    }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

userSchema.methods.incrementLoginAttempts = async function() {
  // Increment first
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts (not after 4)
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
  }
  
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// Export the model
module.exports = mongoose.model('User', userSchema);
