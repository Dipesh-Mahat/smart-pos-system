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
}, { timestamps: true });

// Hash password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
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
      expiresIn: '8h', // Token lifetime
      issuer: 'smart-pos-system',
      audience: 'pos-users'
    }
  );
};

// Export the model
module.exports = mongoose.model('User', userSchema);
