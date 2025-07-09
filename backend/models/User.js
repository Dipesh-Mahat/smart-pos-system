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
    required: function() { return !this.googleId; } // Only required if not using Google OAuth
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  googleProfile: {
    type: Object
  },
  role: { 
    type: String, 
    enum: ['admin', 'shopowner', 'supplier'], // Removed 'user' and kept only the three roles
    default: 'shopowner' // Default to 'storevendor' if not provided
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
  // Added for supplier profiles
  companyName: {
    type: String,
    required: function() { return this.role === 'supplier'; }, // Only required for suppliers
    trim: true
  },
  profilePicture: {
    type: String,
    default: '/images/avatars/user-avatar.png'
  },
  contactDetails: {
    title: String,
    secondaryEmail: String,
    primaryPhone: String,
    secondaryPhone: String
  },
  businessDetails: {
    businessType: {
      type: String,
      enum: ['manufacturer', 'wholesaler', 'distributor', 'retailer'],
      default: 'wholesaler'
    },
    businessRegistration: String,
    taxId: String,
    description: String,
    website: String,
    establishedYear: Number
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  businessSettings: {
    paymentTerms: {
      type: String,
      enum: ['cod', 'net15', 'net30', 'net60', 'prepaid'],
      default: 'net30'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    freeShippingThreshold: {
      type: Number,
      default: 500
    },
    leadTime: {
      type: Number,
      default: 3
    },
    maxOrderQuantity: {
      type: Number,
      default: 1000
    },
    businessHours: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        open: {
          type: Boolean,
          default: true
        },
        openTime: String,
        closeTime: String
      }
    ]
  },
  notificationPreferences: {
    email: {
      newOrders: {
        type: Boolean,
        default: true
      },
      lowStock: {
        type: Boolean,
        default: true
      },
      paymentUpdates: {
        type: Boolean,
        default: true
      },
      weeklyReports: {
        type: Boolean,
        default: false
      }
    },
    sms: {
      urgentAlerts: {
        type: Boolean,
        default: true
      },
      orderUpdates: {
        type: Boolean,
        default: false
      }
    },
    inApp: {
      realtimeUpdates: {
        type: Boolean,
        default: true
      },
      soundAlerts: {
        type: Boolean,
        default: false
      }
    }
  },
  contactNumber: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
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
  passwordResetExpires: Date,
  // Adding fields for supplier settings
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    autoSave: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    loginNotifications: { type: Boolean, default: true }
  },
  integrations: [
    {
      name: { type: String },
      type: { type: String },
      apiKey: { type: String },
      isActive: { type: Boolean, default: true },
      connectedAt: { type: Date },
      scopes: [{ type: String }]
    }
  ],
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'private', 'customers_only'], default: 'public' },
    contactVisibility: { type: String, enum: ['public', 'private', 'customers_only'], default: 'customers_only' }
  },
  activeSessions: [
    {
      id: { type: String },
      deviceName: { type: String },
      browser: { type: String },
      ipAddress: { type: String },
      location: { type: String },
      lastActive: { type: Date, default: Date.now }
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: function() { return this.role === 'supplier' ? 'pending' : 'approved'; }
  }
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
    { 
      id: this._id,
      // Add a unique identifier for refresh tokens too
      jti: crypto.randomBytes(16).toString('hex')
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'smart-pos-system',
      audience: 'pos-users'
    }
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
