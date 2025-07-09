const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const AutoOrder = require('../models/AutoOrder');
const SupplierInventory = require('../models/SupplierInventory');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

/**
 * Get all products from a specific supplier for a shop owner
 */
exports.getSupplierProducts = async (req, res) => {
  try {
    const shopOwnerId = req.user._id;
    const { supplierId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      category, 
      sort = 'name', 
      order = 'asc' 
    } = req.query;
    
    // Validate supplierId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    // First, verify the supplier exists and is actually a supplier
    const supplier = await User.findOne({
      _id: supplierId,
      role: 'supplier'
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Build query
    const query = { 
      'supplierInfo.supplierId': supplierId,
      isActive: true
    };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    
    // Get supplier inventory for stock information
    const inventoryItems = await SupplierInventory.find({
      supplierId: ObjectId(supplierId)
    }).lean();
    
    // Map inventory data to products
    const productsWithInventory = products.map(product => {
      const inventoryItem = inventoryItems.find(item => 
        item.productId.toString() === product._id.toString()
      );
      
      return {
        ...product,
        stock: inventoryItem ? inventoryItem.currentStock : 0,
        costPrice: inventoryItem ? inventoryItem.costPrice : product.costPrice,
        sellingPrice: inventoryItem ? inventoryItem.sellingPrice : product.price,
        status: inventoryItem ? inventoryItem.status : 'unknown'
      };
    });
    
    // Return products with pagination data
    return res.status(200).json({
      success: true,
      data: {
        products: productsWithInventory,
        pagination: {
          total: totalProducts,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalProducts / parseInt(limit))
        },
        supplier: {
          id: supplier._id,
          name: supplier.companyName || `${supplier.firstName} ${supplier.lastName}`,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address
        }
      }
    });
  } catch (error) {
    console.error('Error getting supplier products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier products',
      error: error.message
    });
  }
};

/**
 * Get categories available from a specific supplier
 */
exports.getSupplierCategories = async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // Validate supplierId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }
    
    // Verify the supplier exists
    const supplier = await User.findOne({
      _id: supplierId,
      role: 'supplier'
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Get unique categories from supplier's products
    const categories = await Product.distinct('category', {
      'supplierInfo.supplierId': supplierId,
      isActive: true
    });
    
    return res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error getting supplier categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier categories',
      error: error.message
    });
  }
};

/**
 * Get supplier product statistics and insights
 */
exports.getSupplierProductInsights = async (req, res) => {
  try {
    const shopOwnerId = req.user._id;
    const { supplierId } = req.params;
    
    // Validate supplierId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }
    
    // First, verify the supplier exists
    const supplier = await User.findOne({
      _id: supplierId,
      role: 'supplier'
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Get orders from this shop owner to this supplier
    const orders = await Order.find({
      shopId: shopOwnerId,
      supplierId
    }).lean();
    
    // Calculate product sales from orders
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice;
      });
    });
    
    // Convert to array and sort by quantity
    const sortedSales = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity);
    
    // Get best seller
    const bestSeller = sortedSales.length > 0 ? {
      name: sortedSales[0].name,
      quantity: sortedSales[0].quantity
    } : null;
    
    // Get discounted products
    const discountedProducts = await Product.find({
      'supplierInfo.supplierId': supplierId,
      isActive: true
    })
    .sort({ price: 1 })
    .limit(1)
    .lean();
    
    // Get top discount
    const topDiscount = discountedProducts.length > 0 ? {
      name: discountedProducts[0].name,
      discount: '15%' // This would normally be calculated from price history
    } : null;
    
    // Calculate avg rating (placeholder for now)
    const avgRating = {
      value: 4.7,
      count: 120
    };
    
    // Calculate delivery metrics
    const deliveryTimes = orders
      .filter(order => order.status === 'delivered' && order.actualDeliveryDate)
      .map(order => {
        const deliveryTime = new Date(order.actualDeliveryDate) - new Date(order.orderDate);
        return deliveryTime / (1000 * 60 * 60); // Convert to hours
      });
    
    const fastestDelivery = deliveryTimes.length > 0 ?
      Math.min(...deliveryTimes) : null;
    
    // Format fastest delivery time
    let fastestDeliveryFormatted = null;
    if (fastestDelivery !== null) {
      const days = Math.floor(fastestDelivery / 24);
      const hours = Math.round(fastestDelivery % 24);
      fastestDeliveryFormatted = `${days}d ${hours}h`;
    }
    
    // Return insights
    return res.status(200).json({
      success: true,
      data: {
        bestSeller: bestSeller ? {
          name: bestSeller.name,
          quantity: bestSeller.quantity,
          period: 'this month'
        } : null,
        topDiscount: topDiscount ? {
          name: topDiscount.name,
          discount: topDiscount.discount,
          validUntil: new Date(new Date().setDate(new Date().getDate() + 10))
        } : null,
        avgRating: {
          value: avgRating.value,
          count: avgRating.count
        },
        fastestDelivery: {
          time: fastestDeliveryFormatted || '1d 2h', // Default value if no data
          period: 'all time'
        }
      }
    });
  } catch (error) {
    console.error('Error getting supplier product insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier insights',
      error: error.message
    });
  }
};

/**
 * Place an order with a supplier
 */
exports.placeSupplierOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const shopOwnerId = req.user._id;
    const { supplierId } = req.params;
    const {
      items,
      notes,
      shippingAddress
    } = req.body;
    
    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }
    
    // Validate supplierId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }
    
    // Verify the supplier exists
    const supplier = await User.findOne({
      _id: supplierId,
      role: 'supplier'
    });
    
    if (!supplier) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Get shop owner details
    const shopOwner = await User.findById(shopOwnerId);
    if (!shopOwner) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Shop owner not found'
      });
    }
    
    // Process order items
    const orderItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      // Verify product exists and belongs to supplier
      const product = await Product.findOne({
        _id: item.productId,
        'supplierInfo.supplierId': supplierId,
        isActive: true
      });
      
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found or not available from this supplier`
        });
      }
      
      // Get inventory information for accurate pricing
      const inventory = await SupplierInventory.findOne({
        supplierId,
        productId: item.productId
      });
      
      const unitPrice = inventory ? inventory.sellingPrice : product.price;
      const totalPrice = unitPrice * item.quantity;
      
      // Add to order items
      orderItems.push({
        productId: product._id,
        name: product.name,
        sku: product.barcode,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        discount: 0
      });
      
      subtotal += totalPrice;
    }
    
    // Calculate order totals
    const tax = subtotal * 0.13; // Example tax rate
    const shippingCost = 0; // Can be calculated based on distance, weight, etc.
    const total = subtotal + tax + shippingCost;
    
    // Generate order number
    const orderCount = await Order.countDocuments();
    const year = new Date().getFullYear();
    const orderNumber = `ORD-${year}-${(orderCount + 1).toString().padStart(3, '0')}`;
    
    // Create the order
    const newOrder = new Order({
      orderNumber,
      shopId: shopOwnerId,
      supplierId,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      discount: 0,
      total,
      status: 'pending',
      orderDate: new Date(),
      shippingAddress: shippingAddress || shopOwner.address,
      paymentMethod: 'creditAccount', // Default payment method
      paymentStatus: 'pending',
      notes
    });
    
    await newOrder.save({ session });
    
    await session.commitTransaction();
    
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: {
          _id: newOrder._id,
          orderNumber: newOrder.orderNumber,
          total: newOrder.total,
          status: newOrder.status
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error placing supplier order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Set up auto-order for a supplier product
 */
exports.setupAutoOrder = async (req, res) => {
  try {
    const shopOwnerId = req.user._id;
    const { supplierId } = req.params;
    const {
      productId,
      quantity,
      frequency,
      nextOrderDate,
      notes
    } = req.body;
    
    // Validate supplierId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }
    
    // Validate productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Verify the supplier exists
    const supplier = await User.findOne({
      _id: supplierId,
      role: 'supplier'
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Verify product exists and belongs to supplier
    const product = await Product.findOne({
      _id: productId,
      'supplierInfo.supplierId': supplierId,
      isActive: true
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available from this supplier'
      });
    }
    
    // Check if auto-order already exists for this product and supplier
    const existingAutoOrder = await AutoOrder.findOne({
      shopId: shopOwnerId,
      supplierId,
      productId
    });
    
    if (existingAutoOrder) {
      // Update existing auto-order
      existingAutoOrder.quantity = quantity;
      existingAutoOrder.frequency = frequency;
      existingAutoOrder.nextOrderDate = nextOrderDate;
      existingAutoOrder.notes = notes;
      existingAutoOrder.isActive = true;
      
      await existingAutoOrder.save();
      
      return res.status(200).json({
        success: true,
        message: 'Auto-order updated successfully',
        data: { autoOrder: existingAutoOrder }
      });
    } else {
      // Create new auto-order
      const newAutoOrder = new AutoOrder({
        shopId: shopOwnerId,
        supplierId,
        productId,
        productName: product.name,
        quantity,
        frequency,
        nextOrderDate,
        notes,
        isActive: true
      });
      
      await newAutoOrder.save();
      
      return res.status(201).json({
        success: true,
        message: 'Auto-order created successfully',
        data: { autoOrder: newAutoOrder }
      });
    }
  } catch (error) {
    console.error('Error setting up auto-order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set up auto-order',
      error: error.message
    });
  }
};

/**
 * Get list of auto-orders for a specific supplier
 */
exports.getSupplierAutoOrders = async (req, res) => {
  try {
    const shopOwnerId = req.user._id;
    const { supplierId } = req.params;
    
    // Validate supplierId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }
    
    // Get auto-orders for this shop owner and supplier
    const autoOrders = await AutoOrder.find({
      shopId: shopOwnerId,
      supplierId,
      isActive: true
    })
    .populate('productId', 'name imageUrl category')
    .lean();
    
    return res.status(200).json({
      success: true,
      data: { autoOrders }
    });
  } catch (error) {
    console.error('Error getting supplier auto-orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve auto-orders',
      error: error.message
    });
  }
};

/**
 * Delete an auto-order
 */
exports.deleteAutoOrder = async (req, res) => {
  try {
    const shopOwnerId = req.user._id;
    const { autoOrderId } = req.params;
    
    // Validate autoOrderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(autoOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid auto-order ID format'
      });
    }
    
    // Find and verify auto-order belongs to this shop owner
    const autoOrder = await AutoOrder.findOne({
      _id: autoOrderId,
      shopId: shopOwnerId
    });
    
    if (!autoOrder) {
      return res.status(404).json({
        success: false,
        message: 'Auto-order not found'
      });
    }
    
    // Delete auto-order (soft delete by setting isActive to false)
    autoOrder.isActive = false;
    await autoOrder.save();
    
    return res.status(200).json({
      success: true,
      message: 'Auto-order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting auto-order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete auto-order',
      error: error.message
    });
  }
};
