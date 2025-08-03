const Order = require('../models/Order');
const Product = require('../models/Product');
const SupplierInventory = require('../models/SupplierInventory');
const SupplierInventoryLog = require('../models/SupplierInventoryLog');
const User = require('../models/User');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

/**
 * Get all orders for a supplier with filtering and pagination
 */
exports.getSupplierOrders = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      startDate = '', 
      endDate = '', 
      search = '',
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query with supplier ID filter
    let query = { supplierId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.orderDate.$lte = endDateObj;
      }
    }
    
    // Add search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Find customer IDs matching the search
      const customers = await User.find({
        role: 'shopowner',
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { shopName: searchRegex }
        ]
      }).select('_id');
      
      const customerIds = customers.map(customer => customer._id);
      
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
        { shopId: { $in: customerIds } }
      ];
    }
    
    // Determine sort direction
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortDirection;
    
    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('shopId', 'shopName firstName lastName email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    // Get order statistics
    const stats = await getSupplierOrderStats(supplierId);
    
    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total: totalOrders,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalOrders / parseInt(limit))
        },
        stats
      }
    });
  } catch (error) {
    console.error('Error getting supplier orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

/**
 * Get a single order details for a supplier
 */
exports.getSupplierOrder = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { id } = req.params;
    
    const order = await Order.findOne({
      _id: id,
      supplierId
    })
      .populate('shopId', 'shopName firstName lastName email phone address')
      .populate('items.productId', 'name description category image sku')
      .lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Error getting supplier order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error.message
    });
  }
};

/**
 * Create a new order as a supplier
 */
exports.createSupplierOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const supplierId = req.user._id;
    const {
      shopId,
      items,
      subtotal,
      shippingCost,
      discount,
      total,
      shippingAddress,
      expectedDeliveryDate,
      paymentMethod,
      paymentStatus,
      notes
    } = req.body;
    
    // Verify customer exists and is a shop owner
    const customer = await User.findOne({ _id: shopId, role: 'shopowner' });
    if (!customer) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Customer not found or is not a shop owner'
      });
    }
    
    // Generate unique order number
    const orderCount = await Order.countDocuments();
    const year = new Date().getFullYear();
    const orderNumber = `ORD-${year}-${(orderCount + 1).toString().padStart(3, '0')}`;
    
    // Create order
    const order = new Order({
      orderNumber,
      shopId,
      supplierId,
      items,
      subtotal,
      shippingCost,
      discount,
      total,
      shippingAddress,
      expectedDeliveryDate,
      paymentMethod,
      paymentStatus,
      notes,
      status: 'pending'
    });
    
    // Validate order calculations
    order.calculateTotals();
    
    // Check if the calculated total matches the provided total
    if (Math.abs(order.total - total) > 0.01) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order total calculation mismatch'
      });
    }
    
    // Save order
    await order.save({ session });
    
    // Reduce inventory for ordered items
    for (const item of items) {
      const inventory = await SupplierInventory.findOne({
        supplierId,
        productId: item.productId
      });
      
      if (inventory) {
        // Update inventory
        inventory.currentStock -= item.quantity;
        await inventory.save({ session });
        
        // Create inventory log
        await SupplierInventoryLog.create([{
          supplierId,
          productId: item.productId,
          type: 'sold',
          quantity: -item.quantity,
          previousStock: inventory.currentStock + item.quantity,
          newStock: inventory.currentStock,
          reference: `Order ${orderNumber}`,
          referenceId: order._id,
          referenceModel: 'Order',
          performedBy: supplierId
        }], { session });
      }
    }
    
    await session.commitTransaction();
    
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating supplier order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update order status
 */
exports.updateSupplierOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const supplierId = req.user._id;
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Find order and ensure it belongs to this supplier
    const order = await Order.findOne({
      _id: id,
      supplierId
    });
    
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Handle special status transitions
    if (status === 'cancelled' && order.status !== 'cancelled') {
      // If cancelling an order, return items to inventory
      for (const item of order.items) {
        const inventory = await SupplierInventory.findOne({
          supplierId,
          productId: item.productId
        });
        
        if (inventory) {
          // Update inventory
          inventory.currentStock += item.quantity;
          await inventory.save({ session });
          
          // Create inventory log
          await SupplierInventoryLog.create([{
            supplierId,
            productId: item.productId,
            type: 'correction',
            quantity: item.quantity,
            previousStock: inventory.currentStock - item.quantity,
            newStock: inventory.currentStock,
            reference: `Order ${order.orderNumber} cancelled`,
            referenceId: order._id,
            referenceModel: 'Order',
            performedBy: supplierId
          }], { session });
        }
      }
      
      // Set cancel reason if provided in notes
      if (notes) {
        order.cancelReason = notes;
      }
    }
    
    // If status is delivered, set actualDeliveryDate
    if (status === 'delivered') {
      order.actualDeliveryDate = new Date();
    }
    
    // Update order status and notes
    order.status = status;
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n${notes}` : notes;
    }
    
    await order.save({ session });
    await session.commitTransaction();
    
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating supplier order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Delete an order (only allowed for pending orders)
 */
exports.deleteSupplierOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const supplierId = req.user._id;
    const { id } = req.params;
    
    // Find order and ensure it belongs to this supplier
    const order = await Order.findOne({
      _id: id,
      supplierId
    });
    
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be deleted'
      });
    }
    
    // Return items to inventory
    for (const item of order.items) {
      const inventory = await SupplierInventory.findOne({
        supplierId,
        productId: item.productId
      });
      
      if (inventory) {
        // Update inventory
        inventory.currentStock += item.quantity;
        await inventory.save({ session });
        
        // Create inventory log
        await SupplierInventoryLog.create([{
          supplierId,
          productId: item.productId,
          type: 'correction',
          quantity: item.quantity,
          previousStock: inventory.currentStock - item.quantity,
          newStock: inventory.currentStock,
          reference: `Order ${order.orderNumber} deleted`,
          referenceId: order._id,
          referenceModel: 'Order',
          performedBy: supplierId
        }], { session });
      }
    }
    
    // Delete the order
    await Order.deleteOne({ _id: id }, { session });
    
    await session.commitTransaction();
    
    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting supplier order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get order statistics for a supplier
 */
exports.getSupplierOrderStats = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    const stats = await getSupplierOrderStats(supplierId);
    
    return res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting supplier order stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order statistics',
      error: error.message
    });
  }
};

/**
 * Export orders for a supplier
 */
exports.exportSupplierOrders = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { startDate, endDate, status } = req.query;
    
    // Build query
    let query = { supplierId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.orderDate.$lte = endDateObj;
      }
    }
    
    // Get orders
    const orders = await Order.find(query)
      .populate('shopId', 'shopName firstName lastName email')
      .sort({ orderDate: -1 })
      .lean();
    
    // Format orders for export
    const exportData = orders.map(order => {
      return {
        orderNumber: order.orderNumber,
        customer: order.shopId.shopName || `${order.shopId.firstName} ${order.shopId.lastName}`,
        email: order.shopId.email,
        products: order.items.map(item => `${item.name} (${item.quantity})`).join(', '),
        itemCount: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: order.subtotal,
        tax: order.tax,
        discount: order.discount,
        shippingCost: order.shippingCost,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderDate: order.orderDate,
        expectedDelivery: order.expectedDeliveryDate,
        actualDelivery: order.actualDeliveryDate
      };
    });
    
    return res.status(200).json({
      success: true,
      data: { orders: exportData }
    });
  } catch (error) {
    console.error('Error exporting supplier orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message
    });
  }
};

/**
 * Generate insights and performance metrics for orders
 */
exports.getSupplierOrderInsights = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Calculate fulfillment times (time from order to delivery)
    const fulfillmentTimes = await Order.aggregate([
      { 
        $match: { 
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: 'delivered',
          orderDate: { $exists: true },
          actualDeliveryDate: { $exists: true }
        } 
      },
      {
        $project: {
          fulfillmentTime: { 
            $divide: [
              { $subtract: ['$actualDeliveryDate', '$orderDate'] },
              1000 * 60 * 60 // Convert ms to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgFulfillmentTime: { $avg: '$fulfillmentTime' },
          minFulfillmentTime: { $min: '$fulfillmentTime' },
          maxFulfillmentTime: { $max: '$fulfillmentTime' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate completion rate
    const orderCounts = await Order.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          orderDate: { 
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))  // Last 30 days
          }
        }
      },
      {
        $group: {
          _id: {
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Process order counts
    const statusCounts = {};
    let totalOrders = 0;
    
    orderCounts.forEach(item => {
      statusCounts[item._id.status] = item.count;
      totalOrders += item.count;
    });
    
    // Calculate completion rate
    const completedOrders = statusCounts['delivered'] || 0;
    const cancelledOrders = statusCounts['cancelled'] || 0;
    const completionRate = totalOrders > 0 ? 
      ((completedOrders / (totalOrders - cancelledOrders)) * 100).toFixed(1) : 0;
    
    // Calculate average delivery time
    const avgFulfillmentHours = fulfillmentTimes.length > 0 ? 
      fulfillmentTimes[0].avgFulfillmentTime : 0;
    
    const avgDeliveryTime = {
      days: Math.floor(avgFulfillmentHours / 24),
      hours: Math.round(avgFulfillmentHours % 24)
    };
    
    // Calculate fastest fulfillment
    const minFulfillmentHours = fulfillmentTimes.length > 0 ? 
      fulfillmentTimes[0].minFulfillmentTime : 0;
    
    const fastestFulfillment = {
      hours: Math.floor(minFulfillmentHours),
      minutes: Math.round((minFulfillmentHours - Math.floor(minFulfillmentHours)) * 60)
    };
    
    // Compare with previous month's performance
    const previousMonth = await Order.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          orderDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 60)),
            $lt: new Date(new Date().setDate(new Date().getDate() - 30))
          },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgFulfillmentTime: { 
            $avg: { 
              $divide: [
                { $subtract: ['$actualDeliveryDate', '$orderDate'] },
                1000 * 60 * 60 // Convert ms to hours
              ]
            }
          }
        }
      }
    ]);
    
    // Calculate completion rate change
    const prevMonthCompletionRate = previousMonth.length > 0 ? 
      previousMonth[0].completionRate || 0 : 0;
      
    const completionRateChange = prevMonthCompletionRate > 0 ? 
      ((parseFloat(completionRate) - prevMonthCompletionRate) / prevMonthCompletionRate * 100).toFixed(1) : 0;
    
    // Calculate delivery time change
    const prevMonthAvgFulfillmentTime = previousMonth.length > 0 ? 
      previousMonth[0].avgFulfillmentTime || 0 : 0;
      
    const deliveryTimeChange = prevMonthAvgFulfillmentTime > 0 ? 
      ((prevMonthAvgFulfillmentTime - avgFulfillmentHours) / prevMonthAvgFulfillmentTime * 100).toFixed(1) : 0;
    
    // Insights data
    const insights = {
      fastestFulfillment: `${fastestFulfillment.hours}h ${fastestFulfillment.minutes}m`,
      completionRate: `${completionRate}%`,
      completionRateChange: `${completionRateChange}% vs last month`,
      avgDeliveryTime: `${avgDeliveryTime.days}d ${avgDeliveryTime.hours}h`,
      avgDeliveryTimeChange: `${deliveryTimeChange}%`,
      processingOrders: statusCounts['processing'] || 0,
      processingOrdersToday: 0 // Would need to calculate this separately
    };
    
    return res.status(200).json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    console.error('Error getting supplier order insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order insights',
      error: error.message
    });
  }
};

/**
 * Generate invoices for orders
 */
exports.generateSupplierOrderInvoice = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { id } = req.params;
    
    // Find order
    const order = await Order.findOne({
      _id: id,
      supplierId
    })
      .populate('shopId', 'shopName firstName lastName email phone address')
      .populate('supplierId', 'firstName lastName email phone address companyName')
      .lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get supplier details
    const supplier = await User.findById(supplierId)
      .select('firstName lastName email phone address companyName')
      .lean();
    
    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${order.orderNumber.replace('ORD-', '')}`,
      orderNumber: order.orderNumber,
      date: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      supplier: {
        name: supplier.companyName || `${supplier.firstName} ${supplier.lastName}`,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      },
      customer: {
        name: order.shopId.shopName || `${order.shopId.firstName} ${order.shopId.lastName}`,
        email: order.shopId.email,
        phone: order.shopId.phone,
        address: order.shopId.address
      },
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      shippingCost: order.shippingCost,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      notes: order.notes
    };
    
    return res.status(200).json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    console.error('Error generating supplier order invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
};

// Helper function to get supplier order statistics
async function getSupplierOrderStats(supplierId) {
  try {
    // Convert string ID to ObjectId if needed
    const supplierObjId = typeof supplierId === 'string' ? 
      mongoose.Types.ObjectId(supplierId) : supplierId;
    
    // Get counts by status
    const statusCounts = await Order.aggregate([
      { $match: { supplierId: supplierObjId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Process status counts
    const counts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: 0
    };
    
    statusCounts.forEach(item => {
      counts[item._id] = item.count;
      counts.total += item.count;
    });
    
    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = await Order.aggregate([
      { 
        $match: { 
          supplierId: supplierObjId,
          orderDate: { $gte: today }
        } 
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Process today's counts
    const todayCounts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: 0
    };
    
    todaysOrders.forEach(item => {
      todayCounts[item._id] = item.count;
      todayCounts.total += item.count;
    });
    
    return {
      counts,
      todayCounts
    };
  } catch (error) {
    console.error('Error in getSupplierOrderStats:', error);
    throw error;
  }
}

module.exports.getSupplierOrderStats = getSupplierOrderStats;
