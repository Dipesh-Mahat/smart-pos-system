const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Get all products for a shop
exports.getProducts = async (req, res) => {
  try {
    // Use the authenticated user from middleware
    const shopId = req.user._id;
    const { page = 1, limit = 100, search, category, lowStock, sort = 'name', order = 'asc' } = req.query;
    
    // Build query
    const query = { shopId: shopId };
    
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
    
    // Add low stock filter if requested
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$minStockLevel'] };
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
    
    // Return products with pagination data
    res.status(200).json({
      products,
      pagination: {
        total: totalProducts,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalProducts / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

// Get a single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    // Process the product data
    const skipInventoryLog = req.body.skipInventoryLog === true;
    
    const {
      name,
      description,
      category,
      price,
      cost,
      stock,
      minStockLevel,
      barcode,
      sku,
      brand,
      status
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    // Create the product
    const product = new Product({
      shopId: req.user._id,
      name,
      description,
      category,
      price: parseFloat(price),
      cost: parseFloat(cost || 0),
      stock: parseInt(stock || 0),
      minStockLevel: parseInt(minStockLevel || 0),
      barcode,
      sku,
      brand,
      status: status || 'active'
      // Removed image field since image upload is not needed
    });

    await product.save();

    // Create inventory log for initial stock only if not skipped
    if (!skipInventoryLog && stock && parseInt(stock) > 0) {
      // Inventory log requires additional fields
      const stockQuantity = parseInt(stock);
      const inventoryLog = new InventoryLog({
        productId: product._id,
        shopId: req.user._id,
        performedBy: req.user._id,  // Required field
        quantity: stockQuantity,
        previousStock: 0,           // Required field
        newStock: stockQuantity,    // Required field
        // Use a valid enum value from the schema
        type: 'purchase',  // Changed from 'initial' to a valid enum value
        notes: 'Initial stock entry for new product'
      });
      
      await inventoryLog.save();
    }

    // Return the created product
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle duplicate key errors (like duplicate barcode)
    if (error.code === 11000) {
      let field = 'field';
      let value = '';
      
      if (error.keyPattern && error.keyValue) {
        field = Object.keys(error.keyPattern)[0];
        value = error.keyValue[field];
      }
      
      return res.status(400).json({ 
        success: false, 
        message: `A product with this ${field} (${value}) already exists. Please use a different ${field}.`,
        error: `Duplicate ${field}` 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error: ' + error.message,
        error: error.message 
      });
    }
    
    res.status(500).json({ success: false, message: 'Error creating product', error: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    let shopId;
    
    // For development: if no authenticated user, find any shop owner
    if (req.user && req.user._id) {
      shopId = req.user._id;
    } else {
      // Development fallback: find any shop owner
      const User = require('../models/User');
      const shopOwner = await User.findOne({ role: 'shopowner' });
      if (!shopOwner) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'No shop owner found' });
      }
      shopId = shopOwner._id;
      console.warn('Development mode: Using fallback shop owner for product update');
    }
    
    // Find product and ensure it belongs to the shop
    const product = await Product.findOne({
      _id: req.params.id,
      shopId: shopId
    }).session(session);
    
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if stock level is changing
    const oldStock = product.stock;
    const newStock = req.body.stock !== undefined ? req.body.stock : oldStock;
    
    // Update product fields
    Object.keys(req.body).forEach(key => {
      product[key] = req.body[key];
    });
    
    await product.save({ session });
    
    // If stock changed, log the inventory change
    if (newStock !== oldStock) {
      const inventoryLog = new InventoryLog({
        shopId: shopId,
        productId: product._id,
        type: 'adjustment',
        quantity: newStock - oldStock,
        previousStock: oldStock,
        newStock: newStock,
        reference: 'Manual adjustment',
        notes: req.body.notes || 'Stock updated via product edit',
        performedBy: shopId
      });
      
      await inventoryLog.save({ session });
    }
    
    await session.commitTransaction();
    
    res.status(200).json(product);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Product with this barcode already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update product' });
  } finally {
    session.endSession();
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Get product categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { shopId: req.user._id });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      shopId: req.user._id,
      $expr: { $lte: ['$stock', '$minStockLevel'] }
    }).sort({ stock: 1 });
    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error getting low stock products:', error);
    res.status(500).json({ error: 'Failed to retrieve low stock products' });
  }
};

// Get inventory logs for a product
exports.getProductInventoryLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const logs = await InventoryLog.find({
      shopId: req.user._id,
      productId: req.params.id
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('performedBy', 'name')
      .lean();
    
    const total = await InventoryLog.countDocuments({
      shopId: req.user._id,
      productId: req.params.id
    });
    
    res.status(200).json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting inventory logs:', error);
    res.status(500).json({ error: 'Failed to retrieve inventory logs' });
  }
};

// Delete product image
exports.deleteProductImage = async (req, res) => {
  try {
    // Find product and ensure it belongs to the shop
    const product = await Product.findOne({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Image functionality has been removed
    res.status(400).json({ error: 'Image upload functionality is not available' });
  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    res.status(500).json({ error: 'Failed to delete product image' });
  }
};

// Get all products for a supplier
exports.getSupplierProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, lowStock, sort = 'name', order = 'asc' } = req.query;
    
    // Build query
    const query = { 'supplierInfo.supplierId': req.user._id };
    
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
    
    // Add low stock filter if requested
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$minStockLevel'] };
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
    
    // Get statistics
    const activeProducts = await Product.countDocuments({ ...query, isActive: true });
    const lowStockCount = await Product.countDocuments({ 
      ...query, 
      $expr: { $lte: ['$stock', '$minStockLevel'] }
    });
    const wellStockedCount = await Product.countDocuments({
      ...query,
      $expr: { $gt: ['$stock', { $multiply: ['$minStockLevel', 3] }] }
    });
    
    // Return products with pagination data and stats
    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total: totalProducts,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalProducts / parseInt(limit))
        },
        statistics: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockCount,
          wellStocked: wellStockedCount
        }
      }
    });
  } catch (error) {
    console.error('Error getting supplier products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve products',
      error: error.message 
    });
  }
};

// Create a new product as supplier
exports.createSupplierProduct = async (req, res) => {
  try {
    // Process the product data
    const {
      name,
      description,
      category,
      price,
      cost,
      stock,
      minStockLevel,
      barcode,
      unit = 'piece',
      brand
    } = req.body;

    // Create product with supplier info
    const product = new Product({
      name,
      description,
      category,
      price: parseFloat(price),
      costPrice: parseFloat(cost) || 0,
      stock: parseInt(stock) || 0,
      minStockLevel: parseInt(minStockLevel) || 5,
      barcode,
      unit,
      shopId: null, // No shopId for supplier products
      supplierInfo: {
        supplierId: req.user._id,
        supplierName: req.user.companyName || `${req.user.firstName} ${req.user.lastName}`,
        supplierCode: req.user.supplierCode
      },
      isActive: true
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create product',
      error: error.message 
    });
  }
};

// Update a supplier product
exports.updateSupplierProduct = async (req, res) => {
  try {
    // Find product and verify it belongs to this supplier
    const product = await Product.findOne({
      _id: req.params.id,
      'supplierInfo.supplierId': req.user._id
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found or access denied' 
      });
    }
    
    // Update product data
    const {
      name,
      description,
      category,
      price,
      cost,
      stock,
      minStockLevel,
      barcode,
      unit,
      isActive
    } = req.body;

    // Update fields if provided
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (price) product.price = parseFloat(price);
    if (cost !== undefined) product.costPrice = parseFloat(cost);
    if (stock !== undefined) product.stock = parseInt(stock);
    if (minStockLevel) product.minStockLevel = parseInt(minStockLevel);
    if (barcode !== undefined) product.barcode = barcode;
    if (unit) product.unit = unit;
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Error updating supplier product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update product',
      error: error.message 
    });
  }
};

// Delete a supplier product
exports.deleteSupplierProduct = async (req, res) => {
  try {
    // Find product and verify it belongs to this supplier
    const product = await Product.findOne({
      _id: req.params.id,
      'supplierInfo.supplierId': req.user._id
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found or access denied' 
      });
    }
    
    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete product',
      error: error.message 
    });
  }
};

// Get supplier product stats/insights
exports.getSupplierProductStats = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Get basic statistics
    const totalProducts = await Product.countDocuments({ 'supplierInfo.supplierId': supplierId });
    const activeProducts = await Product.countDocuments({ 'supplierInfo.supplierId': supplierId, isActive: true });
    const lowStockProducts = await Product.countDocuments({ 
      'supplierInfo.supplierId': supplierId, 
      $expr: { $lte: ['$stock', '$minStockLevel'] } 
    });
    const wellStockedProducts = await Product.countDocuments({
      'supplierInfo.supplierId': supplierId,
      $expr: { $gt: ['$stock', { $multiply: ['$minStockLevel', 3] }] }
    });
    
    // Get top selling products
    const topProducts = await Order.aggregate([
      { 
        $match: { 
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: { $in: ['delivered', 'confirmed', 'shipped'] }
        } 
      },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    
    // Get category distribution
    const categoryStats = await Product.aggregate([
      { $match: { 'supplierInfo.supplierId': new mongoose.Types.ObjectId(supplierId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          wellStocked: wellStockedProducts
        },
        topProducts,
        categoryDistribution: categoryStats
      }
    });
    
  } catch (error) {
    console.error('Error getting supplier product stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve product statistics',
      error: error.message 
    });
  }
};

// Get product categories for a supplier
exports.getSupplierCategories = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Get unique categories
    const categories = await Product.distinct('category', { 'supplierInfo.supplierId': supplierId });
    
    res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error getting supplier categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message 
    });
  }
};

// Bulk update product stock for supplier
exports.bulkUpdateStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { products } = req.body;
    const supplierId = req.user._id;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid products array'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // Process each product update
    for (const item of products) {
      const { productId, stock, reason } = item;
      
      // Validate product belongs to this supplier
      const product = await Product.findOne({
        _id: productId,
        'supplierInfo.supplierId': supplierId
      }).session(session);
      
      if (!product) {
        results.failed.push({
          productId,
          message: 'Product not found or access denied'
        });
        continue;
      }
      
      // Update stock
      const oldStock = product.stock;
      product.stock = parseInt(stock);
      await product.save({ session });
      
      // Log the inventory change
      const log = new InventoryLog({
        productId: product._id,
        previousStock: oldStock,
        newStock: product.stock,
        changeAmount: product.stock - oldStock,
        changeType: product.stock > oldStock ? 'increase' : 'decrease',
        reason: reason || 'Bulk stock update',
        userId: supplierId,
        userRole: 'supplier'
      });
      
      await log.save({ session });
      
      results.success.push({
        productId,
        name: product.name,
        previousStock: oldStock,
        newStock: product.stock
      });
    }
    
    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      message: `Updated ${results.success.length} products successfully, ${results.failed.length} failed`,
      data: { results }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in bulk stock update:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update stock',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};
