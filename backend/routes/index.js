const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const userRoutes = require('./userRoutes');
const shopRoutes = require('./shopRoutes');

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// Protected routes (authentication required)
// Apply JWT authentication middleware to all routes below
router.use('/users', authenticateJWT, userRoutes);

// Apply shop routes
router.use('/shop', shopRoutes);

// Admin-only routes
router.get('/admin/stats', authenticateJWT, authorize('admin'), (req, res) => {
  res.status(200).json({ message: 'Admin stats accessed successfully' });
});

// Shop owner routes
router.get('/shop/dashboard', authenticateJWT, authorize('shopowner', 'admin'), (req, res) => {
  res.status(200).json({ message: 'Shop dashboard accessed successfully' });
});

// Store vendor routes
router.get('/vendor/dashboard', authenticateJWT, authorize('storevendor', 'shopowner', 'admin'), (req, res) => {
  res.status(200).json({ message: 'Vendor dashboard accessed successfully' });
});

module.exports = router;