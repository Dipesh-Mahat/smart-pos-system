const express = require('express');
const router = express.Router();
const { authJWT } = require('../middleware/authJWT');
const { authorize } = require('../middleware/authorize');
const supplierInventoryController = require('../controllers/supplierInventoryController');

// Protect all routes - require authentication and supplier role
router.use(authJWT);
router.use(authorize('supplier'));

// Get all inventory items with filtering and pagination
router.get('/inventory', supplierInventoryController.getInventory);

// Get a single inventory item details
router.get('/inventory/:id', supplierInventoryController.getInventoryItem);

// Add new inventory item
router.post('/inventory', supplierInventoryController.addInventoryItem);

// Update inventory item
router.put('/inventory/:id', supplierInventoryController.updateInventoryItem);

// Adjust inventory stock
router.post('/inventory/:id/adjust', supplierInventoryController.adjustStock);

// Delete inventory item
router.delete('/inventory/:id', supplierInventoryController.deleteInventoryItem);

// Get inventory logs
router.get('/inventory/logs', supplierInventoryController.getInventoryLogs);

// Get low stock items
router.get('/inventory/alerts/low-stock', supplierInventoryController.getLowStockItems);

// Get out of stock items
router.get('/inventory/alerts/out-of-stock', supplierInventoryController.getOutOfStockItems);

// Generate inventory report
router.get('/inventory/report', supplierInventoryController.generateInventoryReport);

// Bulk update inventory items
router.put('/inventory/bulk-update', supplierInventoryController.bulkUpdateInventory);

module.exports = router;
