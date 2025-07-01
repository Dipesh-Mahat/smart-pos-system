// routes/userRoutes.js

const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const { sanitizeInput } = require('../utils/security');
const { getProfile, getAllUsers, getAllSuppliers } = require('../controllers/userControllers');
const adminController = require('../controllers/adminController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
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

// Bulk user actions (admin)
router.post('/admin/bulk-action', authenticateJWT, authorize('admin'), adminController.bulkUserAction);

// User activity logs (admin)
router.get('/admin/activity-logs', authenticateJWT, authorize('admin'), adminController.getUserActivityLogs);

// Notify users (admin)
router.post('/admin/notify', authenticateJWT, authorize('admin'), adminController.notifyUsers);

// System health (admin)
router.get('/admin/system-health', authenticateJWT, authorize('admin'), adminController.getSystemHealth);

// Admin audit logs
router.get('/admin/audit-logs', authenticateJWT, authorize('admin'), adminController.getAuditLogs);

// Admin: User growth analytics (last 6 months)
router.get('/admin/user-growth', authenticateJWT, authorize('admin'), adminAnalyticsController.getUserGrowth);

// Admin: Monthly revenue analytics (last 6 months)
router.get('/admin/monthly-revenue', authenticateJWT, authorize('admin'), adminAnalyticsController.getMonthlyRevenue);

// Admin: User distribution analytics
router.get('/admin/user-distribution', authenticateJWT, authorize('admin'), adminAnalyticsController.getUserDistribution);

module.exports = router;
