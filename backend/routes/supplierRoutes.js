const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');

// Import controllers
const orderController = require('../controllers/orderController');
const customerController = require('../controllers/customerController');
const settingsController = require('../controllers/settingsController');

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
router.get('/orders', orderController.getOrders);

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
router.get('/orders/stats', orderController.getOrderStats);

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
router.get('/orders/:id', orderController.getOrder);

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
router.put('/orders/:id/status', orderController.updateOrderStatus);

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
router.get('/settings', settingsController.getSettings);

/**
 * @swagger
 * /supplier/settings:
 *   put:
 *     summary: Update supplier settings
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
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings', settingsController.updateSettings);

/**
 * @swagger
 * /supplier/settings/{section}:
 *   put:
 *     summary: Update specific supplier settings section
 *     tags: [Supplier Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *         description: Settings section to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings section updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings/:section', settingsController.updateSettingSection);

module.exports = router;
