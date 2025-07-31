const SmartInventoryService = require('../services/smartInventoryService');
const AutoOrder = require('../models/AutoOrder');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * Smart Inventory Controller
 * Handles API endpoints for smart inventory management
 */

/**
 * Get inventory dashboard data
 */
const getInventoryDashboard = async (req, res) => {
  try {
    const shopId = req.user.id;
    const dashboard = await SmartInventoryService.getInventoryDashboard(shopId);
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error getting inventory dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory dashboard',
      error: error.message
    });
  }
};

/**
 * Manually check inventory for current shop
 */
const checkInventory = async (req, res) => {
  try {
    const shopId = req.user.id;
    const result = await SmartInventoryService.checkInventoryForShop(shopId);
    
    res.json({
      success: true,
      message: 'Inventory check completed',
      data: result
    });
  } catch (error) {
    console.error('Error checking inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check inventory',
      error: error.message
    });
  }
};

/**
 * Setup or update auto-order for a product
 */
const setupAutoOrder = async (req, res) => {
  try {
    const shopId = req.user.id;
    const {
      productId,
      supplierId,
      minStockLevel,
      reorderQuantity,
      frequency,
      priority,
      seasonalFactor
    } = req.body;

    // Validate required fields
    if (!productId || !supplierId || !minStockLevel || !reorderQuantity || !frequency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId, supplierId, minStockLevel, reorderQuantity, frequency'
      });
    }

    // Validate supplier exists and is actually a supplier
    const supplier = await User.findById(supplierId);
    if (!supplier || supplier.role !== 'supplier') {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID'
      });
    }

    // Validate product belongs to this shop
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.createdBy.toString() !== shopId && product.shopId?.toString() !== shopId) {
      return res.status(403).json({
        success: false,
        message: 'You can only setup auto-orders for your own products'
      });
    }

    const config = {
      shopId,
      productId,
      supplierId,
      minStockLevel: parseInt(minStockLevel),
      reorderQuantity: parseInt(reorderQuantity),
      frequency,
      priority: priority || 'medium',
      seasonalFactor: parseFloat(seasonalFactor) || 1.0
    };

    const autoOrder = await SmartInventoryService.setupAutoOrder(config);

    res.json({
      success: true,
      message: 'Auto-order setup successfully',
      data: autoOrder
    });
  } catch (error) {
    console.error('Error setting up auto-order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup auto-order',
      error: error.message
    });
  }
};

/**
 * Get all auto-orders for current shop
 */
const getAutoOrders = async (req, res) => {
  try {
    const shopId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { shopId };
    if (status) {
      query.isActive = status === 'active';
    }

    const autoOrders = await AutoOrder.find(query)
      .populate('productId', 'name price stock imageUrl')
      .populate('supplierId', 'name email phone')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AutoOrder.countDocuments(query);

    res.json({
      success: true,
      data: {
        autoOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting auto-orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-orders',
      error: error.message
    });
  }
};

/**
 * Update auto-order status (enable/disable/pause)
 */
const updateAutoOrderStatus = async (req, res) => {
  try {
    const { autoOrderId } = req.params;
    const { isActive, autoOrderEnabled } = req.body;
    const shopId = req.user.id;

    const autoOrder = await AutoOrder.findOne({
      _id: autoOrderId,
      shopId: shopId
    });

    if (!autoOrder) {
      return res.status(404).json({
        success: false,
        message: 'Auto-order not found'
      });
    }

    if (typeof isActive === 'boolean') {
      autoOrder.isActive = isActive;
    }
    
    if (typeof autoOrderEnabled === 'boolean') {
      autoOrder.autoOrderEnabled = autoOrderEnabled;
    }

    await autoOrder.save();

    res.json({
      success: true,
      message: 'Auto-order status updated successfully',
      data: autoOrder
    });
  } catch (error) {
    console.error('Error updating auto-order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-order status',
      error: error.message
    });
  }
};

/**
 * Delete auto-order
 */
const deleteAutoOrder = async (req, res) => {
  try {
    const { autoOrderId } = req.params;
    const shopId = req.user.id;

    const autoOrder = await AutoOrder.findOneAndDelete({
      _id: autoOrderId,
      shopId: shopId
    });

    if (!autoOrder) {
      return res.status(404).json({
        success: false,
        message: 'Auto-order not found'
      });
    }

    res.json({
      success: true,
      message: 'Auto-order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting auto-order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete auto-order',
      error: error.message
    });
  }
};

/**
 * Get low stock alerts
 */
const getLowStockAlerts = async (req, res) => {
  try {
    const shopId = req.user.id;
    const alerts = await AutoOrder.getItemsNeedingAttention(shopId);

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        criticalCount: alerts.filter(alert => alert.priority === 'critical').length
      }
    });
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock alerts',
      error: error.message
    });
  }
};

/**
 * Get inventory recommendations
 */
const getInventoryRecommendations = async (req, res) => {
  try {
    const shopId = req.user.id;
    const recommendations = await SmartInventoryService.getInventoryRecommendations(shopId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting inventory recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory recommendations',
      error: error.message
    });
  }
};

/**
 * Update seasonal factor for auto-order (for festival preparations)
 */
const updateSeasonalFactor = async (req, res) => {
  try {
    const { autoOrderId } = req.params;
    const { seasonalFactor, reason } = req.body;
    const shopId = req.user.id;

    if (!seasonalFactor || seasonalFactor < 0.1 || seasonalFactor > 5.0) {
      return res.status(400).json({
        success: false,
        message: 'Seasonal factor must be between 0.1 and 5.0'
      });
    }

    const autoOrder = await AutoOrder.findOne({
      _id: autoOrderId,
      shopId: shopId
    });

    if (!autoOrder) {
      return res.status(404).json({
        success: false,
        message: 'Auto-order not found'
      });
    }

    autoOrder.seasonalFactor = seasonalFactor;
    if (reason) {
      autoOrder.notes = `${autoOrder.notes || ''}\nSeasonal adjustment: ${reason} (Factor: ${seasonalFactor})`;
    }

    await autoOrder.save();

    res.json({
      success: true,
      message: 'Seasonal factor updated successfully',
      data: autoOrder
    });
  } catch (error) {
    console.error('Error updating seasonal factor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seasonal factor',
      error: error.message
    });
  }
};

module.exports = {
  getInventoryDashboard,
  checkInventory,
  setupAutoOrder,
  getAutoOrders,
  updateAutoOrderStatus,
  deleteAutoOrder,
  getLowStockAlerts,
  getInventoryRecommendations,
  updateSeasonalFactor
};
