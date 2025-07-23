const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const { createDynamicRateLimiter } = require('../middleware/rateLimiter');
const {
  getInventoryDashboard,
  checkInventory,
  setupAutoOrder,
  getAutoOrders,
  updateAutoOrderStatus,
  deleteAutoOrder,
  getLowStockAlerts,
  getInventoryRecommendations,
  updateSeasonalFactor
} = require('../controllers/smartInventoryController');

// Apply authentication to all routes
router.use(authenticateJWT);

// Apply rate limiting for smart inventory operations
const inventoryRateLimit = createDynamicRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Allow more requests for inventory operations
});

router.use(inventoryRateLimit);

/**
 * @swagger
 * components:
 *   schemas:
 *     AutoOrder:
 *       type: object
 *       required:
 *         - productId
 *         - supplierId
 *         - minStockLevel
 *         - reorderQuantity
 *         - frequency
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID to auto-order
 *         supplierId:
 *           type: string
 *           description: Supplier ID to order from
 *         minStockLevel:
 *           type: number
 *           minimum: 0
 *           description: Minimum stock level to trigger auto-order
 *         reorderQuantity:
 *           type: number
 *           minimum: 1
 *           description: Quantity to order automatically
 *         frequency:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           description: Order frequency
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Priority level
 *         seasonalFactor:
 *           type: number
 *           minimum: 0.1
 *           maximum: 5.0
 *           description: Seasonal adjustment factor
 */

/**
 * @swagger
 * /api/smart-inventory/dashboard:
 *   get:
 *     summary: Get inventory dashboard data
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     alerts:
 *                       type: array
 *                     recentAutoOrders:
 *                       type: array
 *                     recommendations:
 *                       type: array
 */
router.get('/dashboard', getInventoryDashboard);

/**
 * @swagger
 * /api/smart-inventory/check:
 *   post:
 *     summary: Manually check inventory and trigger auto-orders
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory check results
 */
router.post('/check', checkInventory);

/**
 * @swagger
 * /api/smart-inventory/auto-orders:
 *   get:
 *     summary: Get all auto-orders for current shop
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: List of auto-orders
 *   post:
 *     summary: Setup new auto-order
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutoOrder'
 *     responses:
 *       200:
 *         description: Auto-order created successfully
 *       400:
 *         description: Invalid input data
 */
router.get('/auto-orders', getAutoOrders);
router.post('/auto-orders', setupAutoOrder);

/**
 * @swagger
 * /api/smart-inventory/auto-orders/{autoOrderId}/status:
 *   patch:
 *     summary: Update auto-order status
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoOrderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               autoOrderEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Auto-order not found
 */
router.patch('/auto-orders/:autoOrderId/status', updateAutoOrderStatus);

/**
 * @swagger
 * /api/smart-inventory/auto-orders/{autoOrderId}/seasonal:
 *   patch:
 *     summary: Update seasonal factor for auto-order
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoOrderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seasonalFactor
 *             properties:
 *               seasonalFactor:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 5.0
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seasonal factor updated successfully
 */
router.patch('/auto-orders/:autoOrderId/seasonal', updateSeasonalFactor);

/**
 * @swagger
 * /api/smart-inventory/auto-orders/{autoOrderId}:
 *   delete:
 *     summary: Delete auto-order
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoOrderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Auto-order deleted successfully
 *       404:
 *         description: Auto-order not found
 */
router.delete('/auto-orders/:autoOrderId', deleteAutoOrder);

/**
 * @swagger
 * /api/smart-inventory/alerts:
 *   get:
 *     summary: Get low stock alerts
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock alerts
 */
router.get('/alerts', getLowStockAlerts);

/**
 * @swagger
 * /api/smart-inventory/recommendations:
 *   get:
 *     summary: Get inventory recommendations
 *     tags: [Smart Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory recommendations
 */
router.get('/recommendations', getInventoryRecommendations);

module.exports = router;
