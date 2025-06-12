const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { productImageUpload } = require('../utils/fileUpload');

// Get all products for a shop
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, lowStock, sort = 'name', order = 'asc' } = req.query;
    
    // Build query
    const query = { shopId: req.user._id };
    
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Add shop ID to product data
    const productData = {
      ...req.body,
      shopId: req.user._id
    };
    
    // Create product
    const product = new Product(productData);
    await product.save({ session });
    
    // Create inventory log entry if initial stock is provided
    if (product.stock > 0) {
      const inventoryLog = new InventoryLog({
        shopId: req.user._id,
        productId: product._id,
        type: 'adjustment',
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reference: 'Initial stock',
        notes: 'Initial inventory setup',
        performedBy: req.user._id
      });
      
      await inventoryLog.save({ session });
    }
    
    await session.commitTransaction();
    
    res.status(201).json(product);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Product with this barcode already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    session.endSession();
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find product and ensure it belongs to the shop
    const product = await Product.findOne({
      _id: req.params.id,
      shopId: req.user._id
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
        shopId: req.user._id,
        productId: product._id,
        type: 'adjustment',
        quantity: newStock - oldStock,
        previousStock: oldStock,
        newStock: newStock,
        reference: 'Manual adjustment',
        notes: req.body.notes || 'Stock updated via product edit',
        performedBy: req.user._id
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

// Upload product image
exports.uploadProductImage = async (req, res) => {
  try {
    // The file is already handled by the productImageUpload middleware
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Find product and ensure it belongs to the shop
    const product = await Product.findOne({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!product) {
      // Delete the uploaded file if product doesn't exist
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // If product already has an image, delete the old one
    if (product.imageUrl) {
      const oldImagePath = path.join(__dirname, '..', product.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update product with new image URL
    const imageUrl = `/uploads/products/${path.basename(req.file.path)}`;
    product.imageUrl = imageUrl;
    await product.save();
    
    res.status(200).json({ 
      message: 'Product image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    
    // Delete the uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload product image' });
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
    
    // Check if product has an image
    if (!product.imageUrl) {
      return res.status(400).json({ error: 'Product does not have an image' });
    }
    
    // Delete the image file
    const imagePath = path.join(__dirname, '..', product.imageUrl.replace(/^\//, ''));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // Update product to remove image URL
    product.imageUrl = null;
    await product.save();
    
    res.status(200).json({ message: 'Product image deleted successfully' });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ error: 'Failed to delete product image' });
  }
};
