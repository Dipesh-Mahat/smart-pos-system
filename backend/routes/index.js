const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const userRoutes = require('./userRoutes');
const shopRoutes = require('./shopRoutes');
const autoOrderRoutes = require('./autoOrderRoutes');
const supplierRoutes = require('./supplierRoutes');
const adminController = require('../controllers/adminController');

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// Protected routes (authentication required)
// Apply JWT authentication middleware to all routes below
router.use('/users', authenticateJWT, userRoutes);

// Apply shop routes
router.use('/shop', shopRoutes);

// Apply supplier routes
router.use('/supplier', supplierRoutes);

// Add auto-order routes for shopowners
router.use('/auto-orders', authenticateJWT, autoOrderRoutes);

// Admin-only routes
router.get('/admin/stats', authenticateJWT, authorize('admin'), (req, res) => {
  res.status(200).json({ message: 'Admin stats accessed successfully' });
});

router.get('/admin/dashboard-stats', authenticateJWT, authorize('admin'), adminController.getDashboardStats);
router.get('/admin/transaction-stats', authenticateJWT, authorize('admin'), adminController.getTransactionStats);
router.get('/admin/recent-activity', authenticateJWT, authorize('admin'), adminController.getRecentActivity);
router.get('/admin/system-health', authenticateJWT, authorize('admin'), adminController.getSystemHealth);
router.post('/admin/audit-log', authenticateJWT, authorize('admin'), adminController.createAuditLog);

// Shop owner routes
router.get('/shop/dashboard', authenticateJWT, authorize('shopowner', 'admin'), (req, res) => {
  res.status(200).json({ message: 'Shop dashboard accessed successfully' });
});

// Store vendor routes
router.get('/vendor/dashboard', authenticateJWT, authorize('storevendor', 'shopowner', 'admin'), (req, res) => {
  res.status(200).json({ message: 'Vendor dashboard accessed successfully' });
});

module.exports = router;