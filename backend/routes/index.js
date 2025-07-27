const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const userRoutes = require('./userRoutes');
const shopRoutes = require('./shopRoutes');
const autoOrderRoutes = require('./autoOrderRoutes');
const supplierRoutes = require('./supplierRoutes');
const smartInventoryRoutes = require('./smartInventoryRoutes');
const festivalIntelligenceRoutes = require('./festivalIntelligenceRoutes');
const aiBusinessIntelligenceRoutes = require('./aiBusinessIntelligenceRoutes');
const mobileScannerRoutes = require('./mobileScannerRoutes');
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const productController = require('../controllers/productController');
const transactionController = require('../controllers/transactionController');
const orderController = require('../controllers/orderController');

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// Supplier routes (temporarily disable authentication for testing)
router.get('/shop/orders/suppliers', (req, res, next) => {
  // Mock authentication for testing
  req.user = { _id: '507f1f77bcf86cd799439011', role: 'shopowner' };
  next();
}, orderController.getAvailableSuppliers);

// Protected routes (authentication required)
// Apply JWT authentication middleware to all routes below
router.use('/users', authenticateJWT, userRoutes);

// Apply shop routes
router.use('/shop', shopRoutes);

// Apply supplier routes
router.use('/supplier', supplierRoutes);

// Add auto-order routes for shopowners
router.use('/auto-orders', authenticateJWT, autoOrderRoutes);

// Add smart inventory routes for shopowners
router.use('/smart-inventory', smartInventoryRoutes);

// Add festival intelligence routes for Nepal-specific features
router.use('/festival-intelligence', festivalIntelligenceRoutes);

// Add AI business intelligence routes for advanced analytics
router.use('/ai-intelligence', aiBusinessIntelligenceRoutes);

// Add mobile scanner routes for QR code generation and OCR processing
router.use('/scanner', mobileScannerRoutes);

// Dashboard routes (for shopowners and admins)
// Temporarily disable authentication for development testing
router.get('/dashboard/summary', dashboardController.getDashboardSummary);

// Product routes (temporarily disable authentication for testing)
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProduct);

// Transaction routes (temporarily disable authentication for testing)
router.get('/transactions', transactionController.getTransactions);
router.get('/transactions/:id', transactionController.getTransaction);

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