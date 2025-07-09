const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');

// Import controllers
const orderController = require('../controllers/orderController');
const customerController = require('../controllers/customerController');
const settingsController = require('../controllers/settingsController');
const supplierDashboardController = require('../controllers/supplierDashboardController');
const supplierAnalyticsController = require('../controllers/supplierAnalyticsController');
const supplierCustomerController = require('../controllers/supplierCustomerController');
const supplierInventoryController = require('../controllers/supplierInventoryController');
const supplierOrderController = require('../controllers/supplierOrderController');
const productController = require('../controllers/productController');
const supplierProfileController = require('../controllers/supplierProfileController');
const supplierSettingsController = require('../controllers/supplierSettingsController');

// Apply JWT authentication and supplier authorization to all routes
router.use(authenticateJWT);
router.use(authorize('supplier', 'admin'));

// ================================
// SUPPLIER ORDER MANAGEMENT ROUTES
// ================================

/**
 * @swagger
 * /supplier/orders:
 *   get:
 *     summary: Get all orders for supplier
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number or product name
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/orders', supplierOrderController.getSupplierOrders);

/**
 * @swagger
 * /supplier/orders/stats:
 *   get:
 *     summary: Get order statistics for supplier
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/orders/stats', supplierOrderController.getSupplierOrderStats);

/**
 * @swagger
 * /supplier/orders/{id}:
 *   get:
 *     summary: Get a single order for supplier
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/orders/:id', supplierOrderController.getSupplierOrder);

/**
 * @swagger
 * /supplier/orders/{id}/status:
 *   put:
 *     summary: Update order status (suppliers can confirm, ship, deliver)
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, shipped, delivered]
 *               notes:
 *                 type: string
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/orders/:id/status', supplierOrderController.updateSupplierOrderStatus);

/**
 * @swagger
 * /supplier/orders:
 *   post:
 *     summary: Create a new order as a supplier
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopId:
 *                 type: string
 *                 description: ID of the customer (shop owner)
 *               items:
 *                 type: array
 *                 description: List of order items
 *               subtotal:
 *                 type: number
 *                 description: Order subtotal
 *               tax:
 *                 type: number
 *                 description: Order tax
 *               shippingCost:
 *                 type: number
 *                 description: Shipping cost
 *               discount:
 *                 type: number
 *                 description: Discount amount
 *               total:
 *                 type: number
 *                 description: Order total
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/orders', supplierOrderController.createSupplierOrder);

/**
 * @swagger
 * /supplier/orders/export:
 *   get:
 *     summary: Export orders for a supplier
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date for filtering
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Order status to filter
 *     responses:
 *       200:
 *         description: Orders exported successfully
 *       500:
 *         description: Server error
 */
router.get('/orders/export', supplierOrderController.exportSupplierOrders);

/**
 * @swagger
 * /supplier/orders/insights:
 *   get:
 *     summary: Get order insights and performance metrics
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order insights retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/orders/insights', supplierOrderController.getSupplierOrderInsights);

/**
 * @swagger
 * /supplier/orders/{id}/invoice:
 *   get:
 *     summary: Generate invoice for an order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Invoice generated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/orders/:id/invoice', supplierOrderController.generateSupplierOrderInvoice);

/**
 * @swagger
 * /supplier/orders/{id}:
 *   delete:
 *     summary: Delete an order (pending orders only)
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       400:
 *         description: Only pending orders can be deleted
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.delete('/orders/:id', supplierOrderController.deleteSupplierOrder);

// ================================
// SUPPLIER CUSTOMER MANAGEMENT ROUTES
// (Suppliers can view their customers - shopowners who order from them)
// ================================

/**
 * @swagger
 * /supplier/customers:
 *   get:
 *     summary: Get customers (shopowners) who order from this supplier
 *     tags: [Supplier Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for customer name or email
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    // Get unique shopowners who have placed orders with this supplier
    const Order = require('../models/Order');
    const User = require('../models/User');
    
    // First get all unique shop IDs that have ordered from this supplier
    const orderAggregation = [
      { $match: { supplierId: req.user._id } },
      { 
        $group: { 
          _id: '$shopId',
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          lastOrderDate: { $max: '$orderDate' },
          firstOrderDate: { $min: '$orderDate' }
        } 
      }
    ];
    
    const orderStats = await Order.aggregate(orderAggregation);
    const shopIds = orderStats.map(stat => stat._id);
    
    if (shopIds.length === 0) {
      return res.status(200).json({
        success: true,
        customers: [],
        pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 }
      });
    }
    
    // Build query for users
    let userQuery = { 
      _id: { $in: shopIds },
      role: 'shopowner' 
    };
    
    // Add search filter
    if (search) {
      userQuery.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get customers with pagination
    const customers = await User.find(userQuery)
      .select('shopName firstName lastName email phone address')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Merge with order statistics
    const customersWithStats = customers.map(customer => {
      const stats = orderStats.find(stat => stat._id.toString() === customer._id.toString());
      return {
        ...customer,
        totalOrders: stats?.totalOrders || 0,
        totalSpent: stats?.totalAmount || 0,
        lastOrderDate: stats?.lastOrderDate,
        firstOrderDate: stats?.firstOrderDate
      };
    });
    
    const totalCustomers = await User.countDocuments(userQuery);
    
    res.status(200).json({
      success: true,
      customers: customersWithStats,
      pagination: {
        total: totalCustomers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCustomers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting supplier customers:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve customers' });
  }
});

/**
 * @swagger
 * /supplier/customers/stats:
 *   get:
 *     summary: Get customer statistics for supplier
 *     tags: [Supplier Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/customers/stats', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const User = require('../models/User');
    
    // Get unique customers count
    const uniqueCustomers = await Order.distinct('shopId', { supplierId: req.user._id });
    const totalCustomers = uniqueCustomers.length;
    
    // Get new customers this month
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newCustomersThisMonth = await Order.distinct('shopId', {
      supplierId: req.user._id,
      orderDate: { $gte: thisMonthStart }
    });
    
    // Get top spending customers
    const topCustomers = await Order.aggregate([
      { $match: { supplierId: req.user._id } },
      {
        $group: {
          _id: '$shopId',
          totalSpent: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          shopName: '$customer.shopName',
          firstName: '$customer.firstName',
          lastName: '$customer.lastName',
          totalSpent: 1,
          totalOrders: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        newCustomersThisMonth: newCustomersThisMonth.length,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Error getting supplier customer stats:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve customer statistics' });
  }
});

// ================================
// SUPPLIER SETTINGS ROUTES
// ================================

/**
 * @swagger
 * /supplier/settings:
 *   get:
 *     summary: Get supplier settings
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/settings', supplierSettingsController.getSettings);

/**
 * @swagger
 * /supplier/settings/preferences:
 *   put:
 *     summary: Update supplier preferences
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings/preferences', supplierSettingsController.updatePreferences);

/**
 * @swagger
 * /supplier/settings/notifications:
 *   put:
 *     summary: Update supplier notification settings
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings/notifications', supplierSettingsController.updateNotificationSettings);

/**
 * @swagger
 * /supplier/settings/security:
 *   put:
 *     summary: Update supplier security settings
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Security settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings/security', supplierSettingsController.updateSecuritySettings);

/**
 * @swagger
 * /supplier/settings/sessions:
 *   get:
 *     summary: Get supplier active sessions
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/settings/sessions', supplierSettingsController.getActiveSessions);

/**
 * @swagger
 * /supplier/settings/sessions/{sessionId}:
 *   delete:
 *     summary: Terminate a specific session
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session to terminate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Session terminated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.delete('/settings/sessions/:sessionId', supplierSettingsController.terminateSession);

/**
 * @swagger
 * /supplier/settings/sessions:
 *   delete:
 *     summary: Terminate all sessions except current
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentSessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: All other sessions terminated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/settings/sessions', supplierSettingsController.terminateAllSessions);

/**
 * @swagger
 * /supplier/settings/integrations:
 *   put:
 *     summary: Update supplier integrations
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Integrations updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings/integrations', supplierSettingsController.updateIntegrations);

/**
 * @swagger
 * /supplier/settings/privacy:
 *   put:
 *     summary: Update supplier privacy settings
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings/privacy', supplierSettingsController.updatePrivacySettings);

/**
 * @swagger
 * /supplier/settings/data-export:
 *   post:
 *     summary: Request account data export
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data export requested successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/settings/data-export', supplierSettingsController.requestDataExport);

// Supplier Dashboard Summary
router.get('/dashboard/summary', supplierDashboardController.getSupplierDashboardSummary);

// Supplier Analytics Endpoints
router.get('/analytics/summary', supplierAnalyticsController.getAnalyticsSummary);
router.get('/analytics/revenue-trend', supplierAnalyticsController.getRevenueTrend);
router.get('/analytics/orders-status', supplierAnalyticsController.getOrderStatusDistribution);
router.get('/analytics/top-products', supplierAnalyticsController.getTopProducts);
router.get('/analytics/customer-growth', supplierAnalyticsController.getCustomerGrowth);
router.get('/analytics/reports', supplierAnalyticsController.getReports);

// Supplier Customer Management
router.get('/customers', supplierCustomerController.listCustomers);
router.get('/customers/:id', supplierCustomerController.getCustomer);
router.post('/customers', supplierCustomerController.addCustomer);
router.put('/customers/:id', supplierCustomerController.updateCustomer);
router.patch('/customers/:id/toggle-status', supplierCustomerController.toggleCustomerStatus);
router.get('/customers-export', supplierCustomerController.exportCustomers);

// ================================
// SUPPLIER INVENTORY MANAGEMENT ROUTES
// ================================

/**
 * @swagger
 * /supplier/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name or SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in-stock, low-stock, out-of-stock]
 *         description: Filter by stock status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by inventory location
 *     responses:
 *       200:
 *         description: Inventory items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/inventory', supplierInventoryController.getInventory);

/**
 * @swagger
 * /supplier/inventory/{id}:
 *   get:
 *     summary: Get a single inventory item details
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item retrieved successfully
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/inventory/:id', supplierInventoryController.getInventoryItem);

/**
 * @swagger
 * /supplier/inventory:
 *   post:
 *     summary: Add new inventory item
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - sku
 *               - costPrice
 *               - sellingPrice
 *             properties:
 *               productId:
 *                 type: string
 *               sku:
 *                 type: string
 *               currentStock:
 *                 type: number
 *               minStock:
 *                 type: number
 *               maxStock:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/inventory', supplierInventoryController.addInventoryItem);

/**
 * @swagger
 * /supplier/inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minStock:
 *                 type: number
 *               maxStock:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/inventory/:id', supplierInventoryController.updateInventoryItem);

/**
 * @swagger
 * /supplier/inventory/{id}/adjust:
 *   post:
 *     summary: Adjust inventory stock
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *               - reason
 *             properties:
 *               adjustment:
 *                 type: number
 *                 description: The amount to adjust (positive to add, negative to subtract)
 *               reason:
 *                 type: string
 *                 enum: [received, sold, damaged, transfer, correction]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/inventory/:id/adjust', supplierInventoryController.adjustStock);

/**
 * @swagger
 * /supplier/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/inventory/:id', supplierInventoryController.deleteInventoryItem);

/**
 * @swagger
 * /supplier/inventory-logs:
 *   get:
 *     summary: Get inventory logs
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by log type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Inventory logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/inventory-logs', supplierInventoryController.getInventoryLogs);

/**
 * @swagger
 * /supplier/inventory/alerts/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/inventory/alerts/low-stock', supplierInventoryController.getLowStockItems);

/**
 * @swagger
 * /supplier/inventory/alerts/out-of-stock:
 *   get:
 *     summary: Get out of stock items
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Out of stock items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/inventory/alerts/out-of-stock', supplierInventoryController.getOutOfStockItems);

/**
 * @swagger
 * /supplier/inventory/report:
 *   get:
 *     summary: Generate inventory report
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by stock status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by inventory location
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/inventory/report', supplierInventoryController.generateInventoryReport);

/**
 * @swagger
 * /supplier/inventory/bulk-update:
 *   put:
 *     summary: Bulk update inventory items
 *     tags: [Supplier Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - updateType
 *               - updateData
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *               updateType:
 *                 type: string
 *                 enum: [location, minStock, maxStock]
 *               updateData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Items updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/inventory/bulk-update', supplierInventoryController.bulkUpdateInventory);

// ================================
// SUPPLIER PRODUCT MANAGEMENT ROUTES
// ================================

/**
 * @swagger
 * /supplier/products:
 *   get:
 *     summary: Get all products for supplier
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name, barcode, or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter products with low stock
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/products', productController.getSupplierProducts);

/**
 * @swagger
 * /supplier/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               cost:
 *                 type: number
 *               stock:
 *                 type: integer
 *               minStockLevel:
 *                 type: integer
 *               barcode:
 *                 type: string
 *               unit:
 *                 type: string
 *               tax:
 *                 type: number
 *               productImage:
 *                 type: string
 *                 format: binary
 *             required:
 *               - name
 *               - category
 *               - price
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/products', productController.createSupplierProduct);

/**
 * @swagger
 * /supplier/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               cost:
 *                 type: number
 *               stock:
 *                 type: integer
 *               minStockLevel:
 *                 type: integer
 *               barcode:
 *                 type: string
 *               unit:
 *                 type: string
 *               tax:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               productImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put('/products/:id', productController.updateSupplierProduct);

/**
 * @swagger
 * /supplier/products/{id}:
 *   delete:
 *     summary: Delete a product (soft delete)
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete('/products/:id', productController.deleteSupplierProduct);

/**
 * @swagger
 * /supplier/products/stats:
 *   get:
 *     summary: Get product statistics and insights
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/products/stats', productController.getSupplierProductStats);

/**
 * @swagger
 * /supplier/products/categories:
 *   get:
 *     summary: Get product categories for supplier
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/products/categories', productController.getSupplierCategories);

/**
 * @swagger
 * /supplier/products/bulk-update:
 *   post:
 *     summary: Bulk update product stock
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     stock:
 *                       type: integer
 *                     reason:
 *                       type: string
 *             required:
 *               - products
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/products/bulk-update', productController.bulkUpdateStock);

// ================================
// SUPPLIER PROFILE MANAGEMENT ROUTES
// ================================

/**
 * @swagger
 * /supplier/profile:
 *   get:
 *     summary: Get supplier profile and stats
 *     tags: [Supplier Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get('/profile', supplierProfileController.getSupplierProfile);

/**
 * @swagger
 * /supplier/profile/company:
 *   put:
 *     summary: Update supplier company information
 *     tags: [Supplier Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               businessRegistration:
 *                 type: string
 *               taxId:
 *                 type: string
 *               companyDesc:
 *                 type: string
 *               website:
 *                 type: string
 *               establishedYear:
 *                 type: number
 *     responses:
 *       200:
 *         description: Company information updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile/company', supplierProfileController.updateCompanyInfo);

/**
 * @swagger
 * /supplier/profile/contact:
 *   put:
 *     summary: Update supplier contact details
 *     tags: [Supplier Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primaryContact:
 *                 type: string
 *               contactTitle:
 *                 type: string
 *               primaryEmail:
 *                 type: string
 *               secondaryEmail:
 *                 type: string
 *               primaryPhone:
 *                 type: string
 *               secondaryPhone:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               billingAddress:
 *                 type: string
 *               shippingAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact details updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile/contact', supplierProfileController.updateContactDetails);

/**
 * @swagger
 * /supplier/profile/business-settings:
 *   put:
 *     summary: Update supplier business settings
 *     tags: [Supplier Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultPaymentTerms:
 *                 type: string
 *               currency:
 *                 type: string
 *               shippingMethod:
 *                 type: string
 *               freeShippingThreshold:
 *                 type: number
 *               leadTime:
 *                 type: number
 *               maxOrderQuantity:
 *                 type: number
 *               businessHours:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Business settings updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile/business-settings', supplierProfileController.updateBusinessSettings);

/**
 * @swagger
 * /supplier/profile/notifications:
 *   put:
 *     summary: Update supplier notification preferences
 *     tags: [Supplier Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile/notifications', supplierProfileController.updateNotificationPreferences);

/**
 * @swagger
 * /supplier/profile/picture:
 *   put:
 *     summary: Update supplier profile picture
 *     tags: [Supplier Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile/picture', supplierProfileController.updateProfilePicture);

/**
 * @swagger
 * /supplier/profile/account-status:
 *   put:
 *     summary: Update supplier account status (activate/deactivate)
 *     tags: [Supplier Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate]
 *     responses:
 *       200:
 *         description: Account status updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile/account-status', supplierProfileController.updateAccountStatus);

module.exports = router;
