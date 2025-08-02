const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all orders (different views for shopowners vs suppliers)
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', startDate = '', endDate = '', search = '' } = req.query;
    
    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'shopowner') {
      query.shopId = req.user._id;
    } else if (req.user.role === 'supplier') {
      query.supplierId = req.user._id;
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Add filters
    if (status) {
      query.status = status;
    }
    
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
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('shopId', 'shopName firstName lastName')
      .populate('supplierId', 'firstName lastName email')
      .populate('items.productId', 'name imageUrl')
      .sort({ orderDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
  }
};

// Get a single order
exports.getOrder = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Restrict access based on user role
    if (req.user.role === 'shopowner') {
      query.shopId = req.user._id;
    } else if (req.user.role === 'supplier') {
      query.supplierId = req.user._id;
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const order = await Order.findOne(query)
      .populate('shopId', 'shopName firstName lastName email phone address')
      .populate('supplierId', 'firstName lastName email phone address')
      .populate('items.productId', 'name imageUrl barcode');
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve order' });
  }
};

// Create a new order (shopowner creates order to supplier)
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (req.user.role !== 'shopowner') {
      return res.status(403).json({ success: false, error: 'Only shop owners can create orders' });
    }
    
    const { supplierId, items, notes, requestedDeliveryDate } = req.body;
    
    // Validate supplier exists and is approved
    const supplier = await User.findOne({ 
      _id: supplierId, 
      role: 'supplier', 
      status: 'approved' 
    });
    
    if (!supplier) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or unapproved supplier' 
      });
    }
    
    // Validate and process items
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      
      processedItems.push({
        productId: item.productId,
        name: product.name,
        sku: product.barcode || product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice
      });
    }
    
    // Generate order number
    const orderCount = await Order.countDocuments({ shopId: req.user._id });
    const orderNumber = `ORD-${req.user._id.toString().slice(-6)}-${(orderCount + 1).toString().padStart(4, '0')}`;
    
    // Calculate totals
    const shippingCost = 0; // No shipping cost for now
    const discount = 0; // No discount for now
    const total = subtotal + shippingCost - discount;
    
    // Create order
    const orderData = {
      orderNumber,
      shopId: req.user._id,
      supplierId,
      items: processedItems,
      subtotal,
      shippingCost,
      discount,
      total,
      status: 'pending',
      notes,
      expectedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : undefined
    };
    
    const order = new Order(orderData);
    await order.save({ session });
    
    await session.commitTransaction();
    
    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully', 
      order 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating order:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to create order' });
  } finally {
    session.endSession();
  }
};

// Update order status (suppliers can update status)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes, estimatedDeliveryDate } = req.body;
    
    let query = { _id: req.params.id };
    
    // Only suppliers can update status, only for their orders
    if (req.user.role === 'supplier') {
      query.supplierId = req.user._id;
    } else if (req.user.role === 'shopowner') {
      // Shop owners can only cancel their own orders
      query.shopId = req.user._id;
      if (status !== 'cancelled') {
        return res.status(403).json({ 
          success: false, 
          error: 'Shop owners can only cancel orders' 
        });
      }
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (estimatedDeliveryDate) updateData.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    
    const order = await Order.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Order status updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    let matchQuery = {};
    
    if (req.user.role === 'shopowner') {
      matchQuery.shopId = mongoose.Types.ObjectId(req.user._id);
    } else if (req.user.role === 'supplier') {
      matchQuery.supplierId = mongoose.Types.ObjectId(req.user._id);
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Get order counts by status
    const statusStats = await Order.aggregate([
      { $match: matchQuery },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        } 
      }
    ]);
    
    // Get monthly order trends
    const monthlyStats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    // Get total statistics
    const totalStats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        statusStats,
        monthlyStats,
        totalStats: totalStats[0] || { totalOrders: 0, totalAmount: 0, avgOrderValue: 0 }
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve order statistics' });
  }
};

// Get available suppliers for orders
exports.getAvailableSuppliers = async (req, res) => {
  try {
    // Verify that the user is a shop owner
    if (req.user.role !== 'shopowner' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only shop owners or admins can view suppliers.'
      });
    }

    // Find all users with the role 'supplier'
    const suppliers = await User.find({ role: 'supplier' })
      .select('firstName lastName email shopName companyName profilePicture contactNumber address status businessDetails')
      .lean();

    // Get all orders from this shop owner to analyze supplier relationships
    const shopOrders = await Order.find({ shopId: req.user._id })
      .sort({ orderDate: -1 })
      .populate('supplierId', '_id');

    // Create a map of supplier orders for quick lookup
    const supplierOrdersMap = {};
    shopOrders.forEach(order => {
      if (!order.supplierId || !order.supplierId._id) return;
      
      const supplierId = order.supplierId._id.toString();
      
      if (!supplierOrdersMap[supplierId]) {
        supplierOrdersMap[supplierId] = {
          orders: [],
          lastOrderDate: null,
          totalRating: 0,
          ratingCount: 0
        };
      }
      
      supplierOrdersMap[supplierId].orders.push(order);
      
      // Track the last order date
      if (!supplierOrdersMap[supplierId].lastOrderDate || 
          new Date(order.orderDate) > new Date(supplierOrdersMap[supplierId].lastOrderDate)) {
        supplierOrdersMap[supplierId].lastOrderDate = order.orderDate;
      }
      
      // Track ratings
      if (order.rating) {
        supplierOrdersMap[supplierId].totalRating += order.rating;
        supplierOrdersMap[supplierId].ratingCount++;
      }
    });

    // Fetch product counts for all suppliers in a single query
    const productCounts = await Product.aggregate([
      { 
        $match: { 
          'supplierInfo.supplierId': { $in: suppliers.map(s => s._id) } 
        } 
      },
      {
        $group: {
          _id: '$supplierInfo.supplierId',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create a map of product counts for quick lookup
    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item._id.toString()] = item.count;
    });

    // Process each supplier to add metadata
    const suppliersWithMetadata = suppliers.map(supplier => {
      const supplierId = supplier._id.toString();
      const supplierOrders = supplierOrdersMap[supplierId] || { orders: [], lastOrderDate: null, totalRating: 0, ratingCount: 0 };
      const productCount = productCountMap[supplierId] || 0;
      
      // Calculate average rating
      const avgRating = supplierOrders.ratingCount > 0 
        ? (supplierOrders.totalRating / supplierOrders.ratingCount).toFixed(1) 
        : null;
      
      return {
        ...supplier,
        productCount,
        orderCount: supplierOrders.orders.length,
        rating: avgRating,
        lastOrderDate: supplierOrders.lastOrderDate
      };
    });

    return res.status(200).json({ 
      success: true, 
      suppliers: suppliersWithMetadata
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch suppliers',
      error: error.message 
    });
  }
};

// Get products from a specific supplier
exports.getSupplierProducts = async (req, res) => {
  try {
    if (req.user.role !== 'shopowner') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { supplierId } = req.params;
    
    // Verify supplier exists and is approved
    const supplier = await User.findOne({ 
      _id: supplierId, 
      role: 'supplier', 
      status: 'approved' 
    }).select('firstName lastName email shopName');
    
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found or not approved' });
    }

    // For this implementation, we'll look for products where:
    // 1. The product belongs to the supplier (shopId matches supplierId)
    // 2. OR the product has supplierInfo pointing to this supplier
    const products = await Product.find({
      $or: [
        { shopId: supplierId, isActive: true },
        { 'supplierInfo.supplierId': supplierId, isActive: true }
      ]
    }).select('name description price costPrice stock minStockLevel unit imageUrl category supplierInfo');

    res.status(200).json({ 
      success: true, 
      supplier,
      products 
    });
  } catch (error) {
    console.error('Error getting supplier products:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve supplier products' });
  }
};

// Rate an order and provide feedback on supplier performance
exports.rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, reviewComment } = req.body;
    const shopId = req.user._id;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be a number between 1 and 5'
      });
    }
    
    // Find the order
    const order = await Order.findOne({ 
      _id: orderId,
      shopId // Ensure the order belongs to this shop owner
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to rate it'
      });
    }
    
    // Check if the order is in a status that can be rated (delivered)
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be rated'
      });
    }
    
    // Update the order with rating and review
    order.rating = rating;
    order.reviewComment = reviewComment || '';
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Order rated successfully',
      data: {
        orderId: order._id,
        rating: order.rating,
        reviewComment: order.reviewComment
      }
    });
  } catch (error) {
    console.error('Error rating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate order',
      error: error.message
    });
  }
};
