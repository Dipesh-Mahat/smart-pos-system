// routes/userRoutes.js

const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const { sanitizeInput } = require('../utils/security');
const { getProfile, getAllUsers, getAllSuppliers, changePassword } = require('../controllers/userControllers');
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
router.post('/change-password', authenticateJWT, changePassword);

// Admin: Get all pending suppliers
router.get('/suppliers/pending', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const pendingSuppliers = await User.find({ role: 'supplier', status: 'pending' }).select('-password');
    res.status(200).json({ success: true, suppliers: pendingSuppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Approve supplier
router.put('/suppliers/:id/approve', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const supplier = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'supplier', status: 'pending' },
      { status: 'approved' },
      { new: true }
    ).select('-password');
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found or already approved' });
    }
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Reject supplier
router.put('/suppliers/:id/reject', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const supplier = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'supplier', status: 'pending' },
      { status: 'rejected' },
      { new: true }
    ).select('-password');
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found or already processed' });
    }
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all approved suppliers (for shopowners)
router.get('/suppliers', authenticateJWT, authorize('shopowner', 'admin'), getAllSuppliers);

// Get all products for a supplier (for shopowners to browse)
router.get('/supplier/:supplierId/products', authenticateJWT, authorize('shopowner', 'admin'), async (req, res) => {
  try {
    const { supplierId } = req.params;
    const products = await require('../models/Product').find({ 'supplierInfo.supplierId': supplierId, isActive: true });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
