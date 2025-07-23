const AutoOrder = require('../models/AutoOrder');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { logSecurityEvent } = require('../utils/securityLogger');
const nepaliCalendarService = require('./nepaliCalendarService');

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

  /**
   * Festival-aware inventory checking with seasonal adjustments
   * @param {String} shopId - Shop ID to check inventory for
   * @returns {Object} Enhanced summary with festival context
   */
  static async checkInventoryWithFestivalIntelligence(shopId) {
    try {
      // Get current festival intelligence
      const festivalData = await nepaliCalendarService.getFestivalIntelligence();
      
      // Run standard inventory check
      const standardCheck = await this.checkInventoryForShop(shopId);
      
      // Get products that need festival-aware analysis
      const products = await Product.find({ shopId }).lean();
      
      // Analyze products with festival context
      const festivalAnalysis = {
        currentSeasonalFactor: festivalData.currentSeasonalFactor,
        upcomingFestivals: festivalData.upcomingFestivals,
        festivalAdjustedRecommendations: [],
        urgentFestivalPreparations: []
      };
      
      // Check each product against festival requirements
      for (const product of products) {
        const festivalAdjustment = nepaliCalendarService.calculateFestivalAdjustedQuantity(
          product.quantity,
          product.category
        );
        
        if (festivalAdjustment.finalQuantity > product.quantity * 1.5) {
          festivalAnalysis.festivalAdjustedRecommendations.push({
            productId: product._id,
            productName: product.name,
            currentStock: product.quantity,
            recommendedStock: festivalAdjustment.finalQuantity,
            category: product.category,
            reasoning: festivalAdjustment.reasoning,
            urgency: festivalAdjustment.finalQuantity > product.quantity * 3 ? 'high' : 'medium'
          });
        }
      }
      
      // Check for urgent festival preparations
      const immediatePreparation = festivalData.immediatePreparation || [];
      immediatePreparation.forEach(festival => {
        if (festival.daysUntil <= 7) {
          festivalAnalysis.urgentFestivalPreparations.push({
            festival: festival.name,
            daysUntil: festival.daysUntil,
            seasonalFactor: festival.seasonalFactor,
            recommendations: festival.recommendations,
            action: 'immediate_stock_increase_required'
          });
        }
      });
      
      return {
        ...standardCheck,
        festivalIntelligence: festivalAnalysis,
        enhancedRecommendations: this.generateEnhancedRecommendations(
          standardCheck,
          festivalAnalysis
        )
      };
      
    } catch (error) {
      console.error('Error in festival-aware inventory check:', error);
      // Fallback to standard check if festival service fails
      return await this.checkInventoryForShop(shopId);
    }
  }

  /**
   * Generate enhanced recommendations combining inventory and festival data
   */
  static generateEnhancedRecommendations(standardCheck, festivalAnalysis) {
    const recommendations = [];
    
    // High priority festival preparations
    if (festivalAnalysis.urgentFestivalPreparations.length > 0) {
      recommendations.push({
        type: 'urgent_festival_prep',
        priority: 'critical',
        message: `${festivalAnalysis.urgentFestivalPreparations.length} urgent festival preparations needed`,
        actions: festivalAnalysis.urgentFestivalPreparations.map(prep => 
          `Prepare for ${prep.festival} in ${prep.daysUntil} days`
        )
      });
    }
    
    // Festival-adjusted stock recommendations
    if (festivalAnalysis.festivalAdjustedRecommendations.length > 0) {
      const highUrgency = festivalAnalysis.festivalAdjustedRecommendations.filter(r => r.urgency === 'high');
      if (highUrgency.length > 0) {
        recommendations.push({
          type: 'festival_stock_adjustment',
          priority: 'high',
          message: `${highUrgency.length} products need immediate stock increase for festivals`,
          products: highUrgency.map(r => r.productName)
        });
      }
    }
    
    // Standard low stock with festival context
    if (standardCheck.lowStockItems && standardCheck.lowStockItems.length > 0) {
      const festivalAffected = standardCheck.lowStockItems.filter(item => {
        return festivalAnalysis.festivalAdjustedRecommendations.some(rec => 
          rec.productId.toString() === item.productId?.toString()
        );
      });
      
      if (festivalAffected.length > 0) {
        recommendations.push({
          type: 'low_stock_festival_risk',
          priority: 'high',
          message: `${festivalAffected.length} low stock items are needed for upcoming festivals`,
          seasonalFactor: festivalAnalysis.currentSeasonalFactor
        });
      }
    }
    
    // General seasonal advice
    if (festivalAnalysis.currentSeasonalFactor > 1.5) {
      recommendations.push({
        type: 'seasonal_opportunity',
        priority: 'medium',
        message: `High demand season (${festivalAnalysis.currentSeasonalFactor}x factor) - consider increasing overall inventory`,
        upcomingFestivals: festivalAnalysis.upcomingFestivals.slice(0, 3).map(f => f.name)
      });
    }
    
    return recommendations;
  }

  /**
   * Auto-apply festival factors to auto-orders based on upcoming festivals
   * @param {String} shopId - Shop ID
   * @returns {Object} Update summary
   */
  static async autoApplyFestivalFactors(shopId) {
    try {
      const festivalData = await nepaliCalendarService.getFestivalIntelligence();
      const upcomingMajorFestival = festivalData.upcomingFestivals.find(f => 
        f.category === 'major' && f.daysUntil <= 30
      );
      
      if (!upcomingMajorFestival) {
        return { message: 'No major festivals in next 30 days', updatedCount: 0 };
      }
      
      // Update auto-orders with festival seasonal factor
      const updateResult = await AutoOrder.updateMany(
        { 
          shopId, 
          isActive: true,
          seasonalFactor: { $lt: upcomingMajorFestival.seasonalFactor }
        },
        {
          $set: {
            seasonalFactor: upcomingMajorFestival.seasonalFactor,
            seasonalReason: `Auto-applied for ${upcomingMajorFestival.name} (${upcomingMajorFestival.daysUntil} days)`,
            lastUpdated: new Date()
          }
        }
      );
      
      return {
        festival: upcomingMajorFestival.name,
        daysUntil: upcomingMajorFestival.daysUntil,
        seasonalFactor: upcomingMajorFestival.seasonalFactor,
        updatedCount: updateResult.modifiedCount,
        message: `Auto-applied ${upcomingMajorFestival.name} seasonal factor to ${updateResult.modifiedCount} auto-orders`
      };
      
    } catch (error) {
      console.error('Error auto-applying festival factors:', error);
      throw error;
    }
  }
}

module.exports = SmartInventoryService;
