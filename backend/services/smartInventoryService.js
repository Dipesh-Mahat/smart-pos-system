const AutoOrder = require('../models/AutoOrder');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * Smart Inventory Monitoring Service
 * Handles automatic stock monitoring, alerts, and auto-ordering
 */
class SmartInventoryService {
  
  /**
   * Check all products for low stock and trigger auto-orders
   * @param {String} shopId - Shop ID to check inventory for
   * @returns {Object} Summary of actions taken
   */
  static async checkInventoryForShop(shopId) {
    try {
      const summary = {
        lowStockItems: [],
        autoOrdersCreated: [],
        notificationsSent: [],
        errors: []
      };

      // Get all products for this shop
      const products = await Product.find({ 
        $or: [
          { createdBy: shopId },
          { shopId: shopId }
        ]
      });

      for (const product of products) {
        try {
          // Check if auto order is needed
          const autoOrder = await AutoOrder.checkAutoOrderNeeded(product._id, product.stock);
          
          if (autoOrder) {
            // Create auto order if conditions are met
            const newOrder = await autoOrder.createAutoOrder();
            summary.autoOrdersCreated.push({
              productId: product._id,
              productName: product.name,
              orderId: newOrder._id,
              quantity: newOrder.quantity,
              supplierId: autoOrder.supplierId
            });

            // Log the auto order creation
            logSecurityEvent('AUTO_ORDER_CREATED', {
              shopId,
              productId: product._id,
              orderId: newOrder._id,
              quantity: newOrder.quantity
            });
          }

          // Check for low stock alert (even if auto order wasn't created)
          const allAutoOrders = await AutoOrder.find({
            productId: product._id,
            shopId: shopId,
            isActive: true
          });

          for (const autoOrderItem of allAutoOrders) {
            const adjustedMinStock = Math.ceil(autoOrderItem.minStockLevel * autoOrderItem.seasonalFactor);
            
            if (product.stock <= adjustedMinStock) {
              summary.lowStockItems.push({
                productId: product._id,
                productName: product.name,
                currentStock: product.stock,
                minStockLevel: autoOrderItem.minStockLevel,
                adjustedMinStock,
                priority: autoOrderItem.priority
              });

              // Send notification
              const notification = await autoOrderItem.sendLowStockNotification(product.stock);
              if (notification) {
                summary.notificationsSent.push(notification);
              }
            }
          }

        } catch (error) {
          summary.errors.push({
            productId: product._id,
            productName: product.name,
            error: error.message
          });
          console.error(`Error processing product ${product._id}:`, error);
        }
      }

      return summary;
    } catch (error) {
      console.error('Error in checkInventoryForShop:', error);
      throw error;
    }
  }

  /**
   * Get dashboard data for inventory management
   * @param {String} shopId - Shop ID
   * @returns {Object} Dashboard data
   */
  static async getInventoryDashboard(shopId) {
    try {
      // Get all items needing attention
      const alerts = await AutoOrder.getItemsNeedingAttention(shopId);

      // Get recent auto orders
      const recentAutoOrders = await Order.find({
        shopId: shopId,
        isAutoOrder: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
      .populate('productId', 'name')
      .populate('supplierId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

      // Get inventory statistics
      const totalProducts = await Product.countDocuments({
        $or: [
          { createdBy: shopId },
          { shopId: shopId }
        ]
      });

      const lowStockCount = alerts.length;
      const criticalStockCount = alerts.filter(alert => alert.priority === 'critical').length;

      // Get auto order settings count
      const activeAutoOrders = await AutoOrder.countDocuments({
        shopId: shopId,
        isActive: true
      });

      return {
        summary: {
          totalProducts,
          lowStockCount,
          criticalStockCount,
          activeAutoOrders
        },
        alerts: alerts.slice(0, 10), // Top 10 alerts
        recentAutoOrders,
        recommendations: await this.getInventoryRecommendations(shopId)
      };
    } catch (error) {
      console.error('Error getting inventory dashboard:', error);
      throw error;
    }
  }

  /**
   * Get smart inventory recommendations
   * @param {String} shopId - Shop ID
   * @returns {Array} Array of recommendations
   */
  static async getInventoryRecommendations(shopId) {
    try {
      const recommendations = [];

      // Get products with high sales but low stock
      const products = await Product.find({
        $or: [
          { createdBy: shopId },
          { shopId: shopId }
        ]
      }).select('name stock totalSold price');

      for (const product of products) {
        const salesVelocity = (product.totalSold || 0) / Math.max(1, product.stock || 1);
        
        if (salesVelocity > 2 && product.stock < 20) {
          recommendations.push({
            type: 'increase_stock',
            priority: 'high',
            productId: product._id,
            productName: product.name,
            message: `${product.name} has high sales velocity (${salesVelocity.toFixed(1)}x). Consider increasing stock.`,
            suggestedAction: `Order ${Math.ceil(salesVelocity * 30)} units for next month`
          });
        }

        if (product.stock === 0 && (product.totalSold || 0) > 0) {
          recommendations.push({
            type: 'out_of_stock',
            priority: 'critical',
            productId: product._id,
            productName: product.name,
            message: `${product.name} is out of stock but has sales history.`,
            suggestedAction: 'Restock immediately'
          });
        }
      }

      // Check for products without auto-order setup
      const productsWithoutAutoOrder = await Product.aggregate([
        {
          $match: {
            $or: [
              { createdBy: mongoose.Types.ObjectId(shopId) },
              { shopId: mongoose.Types.ObjectId(shopId) }
            ]
          }
        },
        {
          $lookup: {
            from: 'autoorders',
            localField: '_id',
            foreignField: 'productId',
            as: 'autoOrder'
          }
        },
        {
          $match: {
            autoOrder: { $size: 0 },
            totalSold: { $gt: 5 } // Products with some sales history
          }
        },
        {
          $limit: 5
        }
      ]);

      for (const product of productsWithoutAutoOrder) {
        recommendations.push({
          type: 'setup_auto_order',
          priority: 'medium',
          productId: product._id,
          productName: product.name,
          message: `${product.name} could benefit from auto-ordering setup.`,
          suggestedAction: 'Configure automatic reordering'
        });
      }

      return recommendations.slice(0, 10); // Limit to top 10 recommendations
    } catch (error) {
      console.error('Error getting inventory recommendations:', error);
      return [];
    }
  }

  /**
   * Setup auto-order for a product
   * @param {Object} config - Auto order configuration
   * @returns {Object} Created auto order
   */
  static async setupAutoOrder(config) {
    try {
      const {
        shopId,
        productId,
        supplierId,
        minStockLevel,
        reorderQuantity,
        frequency,
        priority = 'medium',
        seasonalFactor = 1.0
      } = config;

      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if auto order already exists
      const existingAutoOrder = await AutoOrder.findOne({
        productId,
        shopId
      });

      if (existingAutoOrder) {
        // Update existing auto order
        existingAutoOrder.supplierId = supplierId;
        existingAutoOrder.minStockLevel = minStockLevel;
        existingAutoOrder.reorderQuantity = reorderQuantity;
        existingAutoOrder.frequency = frequency;
        existingAutoOrder.priority = priority;
        existingAutoOrder.seasonalFactor = seasonalFactor;
        existingAutoOrder.isActive = true;
        
        await existingAutoOrder.save();
        return existingAutoOrder;
      } else {
        // Create new auto order
        const autoOrder = new AutoOrder({
          shopId,
          productId,
          supplierId,
          productName: product.name,
          quantity: reorderQuantity,
          minStockLevel,
          reorderQuantity,
          frequency,
          priority,
          seasonalFactor,
          isActive: true,
          autoOrderEnabled: true
        });

        await autoOrder.save();
        return autoOrder;
      }
    } catch (error) {
      console.error('Error setting up auto order:', error);
      throw error;
    }
  }

  /**
   * Process all pending auto orders (to be run as a cron job)
   */
  static async processAllAutoOrders() {
    try {
      console.log('Starting auto order processing...');
      
      // Get all unique shop IDs with active auto orders
      const shopIds = await AutoOrder.distinct('shopId', { 
        isActive: true,
        autoOrderEnabled: true 
      });

      const results = {
        totalShopsProcessed: shopIds.length,
        totalAutoOrdersCreated: 0,
        totalNotificationsSent: 0,
        errors: []
      };

      for (const shopId of shopIds) {
        try {
          const shopResult = await this.checkInventoryForShop(shopId);
          results.totalAutoOrdersCreated += shopResult.autoOrdersCreated.length;
          results.totalNotificationsSent += shopResult.notificationsSent.length;
          
          if (shopResult.errors.length > 0) {
            results.errors.push(...shopResult.errors);
          }
        } catch (error) {
          results.errors.push({
            shopId,
            error: error.message
          });
          console.error(`Error processing shop ${shopId}:`, error);
        }
      }

      console.log('Auto order processing completed:', results);
      return results;
    } catch (error) {
      console.error('Error in processAllAutoOrders:', error);
      throw error;
    }
  }
}

module.exports = SmartInventoryService;
