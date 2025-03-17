// routes/userRoutes.js

const express = require('express');
const User = require('../models/User');
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const { sanitizeInput } = require('../utils/security');
const router = express.Router();

// Register a new user (shopowner, storevendor, admin)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, shopName } = req.body;

    // Input validation
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        success: false,
        error: 'All required fields must be provided' 
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      username: sanitizeInput(username),
      email: email.toLowerCase(),
      password,
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      role,
      shopName: role === 'shopowner' ? sanitizeInput(shopName) : undefined
    };

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: sanitizedData.email },
        { username: sanitizedData.username }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const newUser = new User(sanitizedData);
    await newUser.save();

    // Generate JWT token
    const token = newUser.generateAuthToken();

    res.status(201).json({
      success: true,
      message: `${role} created successfully!`,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
});

// Login a user (generates JWT token)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = user.generateAuthToken();
    
    res.status(200).json({ 
      success: true,
      message: 'Login successful', 
      token,
      user: {
        id: user._id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// Admin-only route
router.get('/admin-dashboard', authenticateJWT, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Admin Dashboard'
  });
});

// Shopowner-only route
router.get('/shopowner-dashboard', authenticateJWT, authorize('shopowner', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Shopowner Dashboard'
  });
});

// Storevendor-only route
router.get('/storevendor-dashboard', authenticateJWT, authorize('storevendor', 'shopowner', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Storevendor Dashboard'
  });
});

module.exports = router;
