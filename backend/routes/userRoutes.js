// routes/userRoutes.js

const express = require('express');
const User = require('../models/User');
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const { sanitizeInput } = require('../utils/security');
const router = express.Router();

// Register a new user route has been moved to authRoutes.js
// Login route has been moved to authRoutes.js

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
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
