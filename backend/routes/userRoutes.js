// routes/userRoutes.js

const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const { sanitizeInput } = require('../utils/security');
const router = express.Router();

// Register a new user route has been moved to authRoutes.js
// Login route has been moved to authRoutes.js

// Get current user profile
router.get('/profile', authenticateJWT, async (req, res) => {
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

// Change password route
router.post('/change-password', authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Password requirements validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character'
      });
    }
    
    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
