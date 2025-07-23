const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AutoOrderSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  nextOrderDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  notes: String,
  lastOrderDate: { type: Date },
  ordersPlaced: { type: Number, default: 0 },
  
  // Enhanced smart inventory features
  minStockLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  reorderQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  autoOrderEnabled: {
    type: Boolean,
    default: true
  },
  orderFrequencyDays: {
    type: Number,
    default: 7, // Minimum days between auto orders
    min: 1
  },
  maxOrdersPerMonth: {
    type: Number,
    default: 4, // Safety limit
    min: 1,
    max: 30
  },
  lastNotificationSent: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  seasonalFactor: {
    type: Number,
    default: 1.0, // Multiplier for seasonal demand
    min: 0.1,
    max: 5.0
  }
}, { timestamps: true });

// Indexes for faster queries
AutoOrderSchema.index({ shopId: 1, supplierId: 1 });
AutoOrderSchema.index({ shopId: 1, isActive: 1 });
AutoOrderSchema.index({ nextOrderDate: 1, isActive: 1 });
AutoOrderSchema.index({ productId: 1, shopId: 1 }, { unique: true });
AutoOrderSchema.index({ priority: 1, isActive: 1 });

// Pre-save middleware to validate business rules
AutoOrderSchema.pre('save', function(next) {
  // Ensure reorder quantity is reasonable
  if (this.reorderQuantity < this.minStockLevel) {
    this.reorderQuantity = this.minStockLevel * 2; // Default to 2x min stock
  }
  
  // Auto-calculate next order date if not set
  if (!this.nextOrderDate && this.frequency) {
    const now = new Date();
    switch (this.frequency) {
      case 'daily':
        this.nextOrderDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        this.nextOrderDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        this.nextOrderDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
    }
  }
  
  next();
});

// Static method to check if auto order is needed for a product
AutoOrderSchema.statics.checkAutoOrderNeeded = async function(productId, currentStock) {
  const autoOrder = await this.findOne({
    productId: productId,
    isActive: true,
    autoOrderEnabled: true
  }).populate('productId shopId supplierId');

  if (!autoOrder) return null;

  // Apply seasonal factor to minimum stock level
  const adjustedMinStock = Math.ceil(autoOrder.minStockLevel * autoOrder.seasonalFactor);

  // Check if stock is below minimum (with seasonal adjustment)
  if (currentStock > adjustedMinStock) return null;

  // Check if enough time has passed since last order
  if (autoOrder.lastOrderDate) {
    const daysSinceLastOrder = (Date.now() - autoOrder.lastOrderDate) / (1000 * 60 * 60 * 24);
    if (daysSinceLastOrder < autoOrder.orderFrequencyDays) return null;
  }

  // Check monthly order limit
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  
  const Order = mongoose.model('Order');
  const ordersThisMonth = await Order.countDocuments({
    productId: productId,
    supplierId: autoOrder.supplierId,
    createdAt: { $gte: monthStart },
    isAutoOrder: true
  });

  if (ordersThisMonth >= autoOrder.maxOrdersPerMonth) return null;

  return autoOrder;
};

// Instance method to create auto order
AutoOrderSchema.methods.createAutoOrder = async function() {
  try {
    const Order = mongoose.model('Order');
    
    // Calculate quantity with seasonal adjustment
    const adjustedQuantity = Math.ceil(this.reorderQuantity * this.seasonalFactor);
    
    const newOrder = new Order({
      productId: this.productId,
      supplierId: this.supplierId,
      shopId: this.shopId,
      quantity: adjustedQuantity,
      status: 'pending',
      isAutoOrder: true,
      autoOrderId: this._id,
      totalAmount: 0, // Will be calculated when supplier accepts
      notes: `Auto-generated order - Stock below ${this.minStockLevel} units (Priority: ${this.priority})`
    });

    await newOrder.save();

    // Update auto order record
    this.lastOrderDate = new Date();
    this.ordersPlaced += 1;
    await this.save();

    return newOrder;
  } catch (error) {
    throw new Error(`Failed to create auto order: ${error.message}`);
  }
};

// Instance method to send low stock notification
AutoOrderSchema.methods.sendLowStockNotification = async function(currentStock) {
  // Check if notification was sent recently (within 24 hours)
  if (this.lastNotificationSent) {
    const hoursSinceLastNotification = (Date.now() - this.lastNotificationSent) / (1000 * 60 * 60);
    if (hoursSinceLastNotification < 24) return;
  }

  try {
    // For now, we'll log this - later we can implement push notifications
    console.log(`LOW STOCK ALERT: ${this.productName} is running low (${currentStock} units left). Minimum: ${this.minStockLevel}`);

    this.lastNotificationSent = new Date();
    await this.save();

    return {
      type: 'low_stock_alert',
      productId: this.productId,
      productName: this.productName,
      currentStock,
      minStockLevel: this.minStockLevel,
      priority: this.priority,
      shopId: this.shopId
    };
  } catch (error) {
    console.error('Failed to send low stock notification:', error);
    throw error;
  }
};

// Static method to get all items needing attention
AutoOrderSchema.statics.getItemsNeedingAttention = async function(shopId) {
  const Product = mongoose.model('Product');
  
  // Get all active auto orders for this shop
  const autoOrders = await this.find({
    shopId: shopId,
    isActive: true
  }).populate('productId');

  const alerts = [];

  for (const autoOrder of autoOrders) {
    const product = autoOrder.productId;
    if (!product) continue;

    const currentStock = product.stock || 0;
    const adjustedMinStock = Math.ceil(autoOrder.minStockLevel * autoOrder.seasonalFactor);

    if (currentStock <= adjustedMinStock) {
      alerts.push({
        autoOrderId: autoOrder._id,
        productId: product._id,
        productName: product.name,
        currentStock,
        minStockLevel: autoOrder.minStockLevel,
        adjustedMinStock,
        priority: autoOrder.priority,
        canAutoOrder: autoOrder.autoOrderEnabled,
        daysSinceLastOrder: autoOrder.lastOrderDate ? 
          Math.floor((Date.now() - autoOrder.lastOrderDate) / (1000 * 60 * 60 * 24)) : null
      });
    }
  }

  return alerts.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
};

module.exports = mongoose.model('AutoOrder', AutoOrderSchema);
