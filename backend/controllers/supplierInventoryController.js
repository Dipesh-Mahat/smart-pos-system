const SupplierInventory = require('../models/SupplierInventory');
const SupplierInventoryLog = require('../models/SupplierInventoryLog');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

/**
 * Get all inventory items for a supplier
 */
exports.getInventory = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Handle filtering
    let filter = { supplierId };
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      const productIds = await Product.find({ 
        supplierId, 
        $or: [{ name: searchRegex }, { sku: searchRegex }] 
      }).select('_id');
      
      filter.productId = { $in: productIds.map(p => p._id) };
    }
    
    if (req.query.category) {
      const categoryProductIds = await Product.find({
        supplierId,
        category: req.query.category
      }).select('_id');
      
      filter.productId = filter.productId 
        ? { $in: filter.productId.$in.filter(id => categoryProductIds.map(p => p._id.toString()).includes(id.toString())) }
        : { $in: categoryProductIds.map(p => p._id) };
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.location) {
      filter.location = req.query.location;
    }
    
    // Get total count for pagination
    const total = await SupplierInventory.countDocuments(filter);
    
    // Get inventory data with populated product info
    const inventoryItems = await SupplierInventory.find(filter)
      .populate('productId', 'name description category image')
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get inventory statistics
    const stats = await getInventoryStats(supplierId);
    
    return res.status(200).json({
      success: true,
      data: {
        items: inventoryItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats
      }
    });
  } catch (error) {
    console.error('Error in getInventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory',
      error: error.message
    });
  }
};

/**
 * Get a single inventory item details
 */
exports.getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const supplierId = req.user._id;
    
    const inventoryItem = await SupplierInventory.findOne({
      _id: id,
      supplierId
    }).populate('productId', 'name description category image');
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Get recent logs for this item
    const logs = await SupplierInventoryLog.find({
      supplierId,
      productId: inventoryItem.productId._id
    })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return res.status(200).json({
      success: true,
      data: {
        item: inventoryItem,
        logs
      }
    });
  } catch (error) {
    console.error('Error in getInventoryItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory item',
      error: error.message
    });
  }
};

/**
 * Add new inventory item
 */
exports.addInventoryItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const supplierId = req.user._id;
    const { productId, sku, currentStock, minStock, maxStock, costPrice, sellingPrice, location, notes, batchNumber, expiryDate } = req.body;
    
    // Verify product belongs to this supplier
    const product = await Product.findOne({ _id: productId, supplierId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to this supplier'
      });
    }
    
    // Check if this product already exists in inventory
    const existingItem = await SupplierInventory.findOne({ supplierId, productId });
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'This product already exists in your inventory'
      });
    }
    
    // Create new inventory item
    const newInventoryItem = new SupplierInventory({
      supplierId,
      productId,
      sku,
      currentStock: parseFloat(currentStock) || 0,
      minStock: parseFloat(minStock) || 0,
      maxStock: parseFloat(maxStock) || 0,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      location: location || '',
      notes: notes || '',
      batchNumber: batchNumber || '',
      expiryDate: expiryDate || null
    });
    
    await newInventoryItem.save({ session });
    
    // Create inventory log entry
    const inventoryLog = new SupplierInventoryLog({
      supplierId,
      productId,
      type: 'initial',
      quantity: parseFloat(currentStock) || 0,
      previousStock: 0,
      newStock: parseFloat(currentStock) || 0,
      notes: 'Initial inventory setup',
      location: location || '',
      performedBy: supplierId
    });
    
    await inventoryLog.save({ session });
    
    // Update product with inventory information
    product.inStock = true;
    product.currentStock = parseFloat(currentStock) || 0;
    product.price = parseFloat(sellingPrice);
    
    await product.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: newInventoryItem
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in addInventoryItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add inventory item',
      error: error.message
    });
  }
};

/**
 * Update inventory item
 */
exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const supplierId = req.user._id;
    const { minStock, maxStock, costPrice, sellingPrice, location, notes, batchNumber, expiryDate } = req.body;
    
    const inventoryItem = await SupplierInventory.findOne({
      _id: id,
      supplierId
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Update fields that are allowed to be changed directly
    if (minStock !== undefined) inventoryItem.minStock = parseFloat(minStock);
    if (maxStock !== undefined) inventoryItem.maxStock = parseFloat(maxStock);
    if (costPrice !== undefined) inventoryItem.costPrice = parseFloat(costPrice);
    if (sellingPrice !== undefined) inventoryItem.sellingPrice = parseFloat(sellingPrice);
    if (location !== undefined) inventoryItem.location = location;
    if (notes !== undefined) inventoryItem.notes = notes;
    if (batchNumber !== undefined) inventoryItem.batchNumber = batchNumber;
    if (expiryDate !== undefined) inventoryItem.expiryDate = expiryDate;
    
    inventoryItem.lastUpdated = Date.now();
    
    await inventoryItem.save();
    
    // Update product price if selling price changed
    if (sellingPrice !== undefined) {
      await Product.findByIdAndUpdate(inventoryItem.productId, {
        price: parseFloat(sellingPrice)
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventoryItem
    });
  } catch (error) {
    console.error('Error in updateInventoryItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
};

/**
 * Adjust inventory stock
 */
exports.adjustStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const supplierId = req.user._id;
    const { adjustment, reason, notes } = req.body;
    
    const adjustmentValue = parseFloat(adjustment);
    
    // Validate adjustment value is not zero
    if (adjustmentValue === 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment value cannot be zero'
      });
    }
    
    // Validate reason
    const validReasons = ['received', 'sold', 'damaged', 'transfer', 'correction'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment reason'
      });
    }
    
    // Find inventory item
    const inventoryItem = await SupplierInventory.findOne({
      _id: id,
      supplierId
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    const previousStock = inventoryItem.currentStock;
    const newStock = previousStock + adjustmentValue;
    
    // Prevent negative stock (unless it's an inventory correction)
    if (newStock < 0 && reason !== 'correction') {
      return res.status(400).json({
        success: false,
        message: 'Stock adjustment would result in negative stock'
      });
    }
    
    // Update inventory item
    inventoryItem.currentStock = newStock;
    inventoryItem.lastUpdated = Date.now();
    
    await inventoryItem.save({ session });
    
    // Create inventory log entry
    const inventoryLog = new SupplierInventoryLog({
      supplierId,
      productId: inventoryItem.productId,
      type: reason,
      quantity: adjustmentValue,
      previousStock,
      newStock,
      notes: notes || `Stock ${adjustmentValue > 0 ? 'increased' : 'decreased'} due to ${reason}`,
      location: inventoryItem.location,
      performedBy: supplierId
    });
    
    await inventoryLog.save({ session });
    
    // Update product stock
    await Product.findByIdAndUpdate(inventoryItem.productId, {
      currentStock: newStock,
      inStock: newStock > 0
    }, { session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        item: inventoryItem,
        log: inventoryLog
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in adjustStock:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to adjust stock',
      error: error.message
    });
  }
};

/**
 * Get inventory logs for a supplier
 */
exports.getInventoryLogs = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Handle filtering
    let filter = { supplierId };
    
    if (req.query.productId) {
      filter.productId = req.query.productId;
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get total count for pagination
    const total = await SupplierInventoryLog.countDocuments(filter);
    
    // Get logs with populated product info
    const logs = await SupplierInventoryLog.find(filter)
      .populate('productId', 'name sku category')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getInventoryLogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory logs',
      error: error.message
    });
  }
};

/**
 * Delete inventory item
 */
exports.deleteInventoryItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const supplierId = req.user._id;
    
    // Find inventory item
    const inventoryItem = await SupplierInventory.findOne({
      _id: id,
      supplierId
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    const productId = inventoryItem.productId;
    
    // Delete all logs for this inventory item
    await SupplierInventoryLog.deleteMany({
      supplierId,
      productId
    }, { session });
    
    // Delete inventory item
    await SupplierInventory.findByIdAndDelete(id, { session });
    
    // Update product stock info
    await Product.findByIdAndUpdate(productId, {
      inStock: false,
      currentStock: 0
    }, { session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in deleteInventoryItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message
    });
  }
};

/**
 * Get low stock items
 */
exports.getLowStockItems = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    const lowStockItems = await SupplierInventory.find({
      supplierId,
      status: 'low-stock'
    }).populate('productId', 'name description category image');
    
    return res.status(200).json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Error in getLowStockItems:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve low stock items',
      error: error.message
    });
  }
};

/**
 * Get out of stock items
 */
exports.getOutOfStockItems = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    const outOfStockItems = await SupplierInventory.find({
      supplierId,
      status: 'out-of-stock'
    }).populate('productId', 'name description category image');
    
    return res.status(200).json({
      success: true,
      data: outOfStockItems
    });
  } catch (error) {
    console.error('Error in getOutOfStockItems:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve out of stock items',
      error: error.message
    });
  }
};

/**
 * Generate inventory report
 */
exports.generateInventoryReport = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { category, status, location } = req.query;
    
    // Build filter based on query params
    let filter = { supplierId };
    
    if (category) {
      const categoryProductIds = await Product.find({
        supplierId,
        category
      }).select('_id');
      
      filter.productId = { $in: categoryProductIds.map(p => p._id) };
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (location) {
      filter.location = location;
    }
    
    // Get inventory items for report
    const inventoryItems = await SupplierInventory.find(filter)
      .populate('productId', 'name sku category')
      .sort({ status: 1, lastUpdated: -1 });
    
    // Get inventory statistics
    const stats = await getInventoryStats(supplierId);
    
    // Format data for report
    const reportData = {
      generatedDate: new Date(),
      stats,
      items: inventoryItems.map(item => ({
        id: item._id,
        productName: item.productId.name,
        sku: item.sku || item.productId.sku,
        category: item.productId.category,
        currentStock: item.currentStock,
        minStock: item.minStock,
        maxStock: item.maxStock,
        status: item.status,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        value: item.currentStock * item.costPrice,
        location: item.location,
        lastUpdated: item.lastUpdated
      }))
    };
    
    return res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Error in generateInventoryReport:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      error: error.message
    });
  }
};

/**
 * Bulk update inventory items
 */
exports.bulkUpdateInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const supplierId = req.user._id;
    const { items, updateType, updateData } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for bulk update'
      });
    }
    
    // Verify all items exist and belong to this supplier
    const inventoryItems = await SupplierInventory.find({
      _id: { $in: items },
      supplierId
    });
    
    if (inventoryItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more inventory items not found'
      });
    }
    
    const validUpdateTypes = ['location', 'minStock', 'maxStock'];
    if (!validUpdateTypes.includes(updateType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update type'
      });
    }
    
    // Perform bulk update based on update type
    let updateField = {};
    
    if (updateType === 'location') {
      updateField = { location: updateData.location };
    } else if (updateType === 'minStock') {
      updateField = { minStock: parseFloat(updateData.minStock) };
    } else if (updateType === 'maxStock') {
      updateField = { maxStock: parseFloat(updateData.maxStock) };
    }
    
    // Update all selected items
    await SupplierInventory.updateMany(
      { _id: { $in: items }, supplierId },
      { $set: { ...updateField, lastUpdated: Date.now() } },
      { session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      success: true,
      message: `Successfully updated ${items.length} inventory items`,
      updatedCount: items.length
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in bulkUpdateInventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform bulk update',
      error: error.message
    });
  }
};

/**
 * Get inventory statistics
 * @param {ObjectId} supplierId 
 * @returns {Object} Statistics
 */
async function getInventoryStats(supplierId) {
  // Get total products count
  const totalProducts = await SupplierInventory.countDocuments({ supplierId });
  
  // Get low stock items
  const lowStockItems = await SupplierInventory.countDocuments({ 
    supplierId, 
    status: 'low-stock' 
  });
  
  // Get out of stock items
  const outOfStockItems = await SupplierInventory.countDocuments({ 
    supplierId, 
    status: 'out-of-stock' 
  });
  
  // Get total inventory value
  const inventoryValue = await SupplierInventory.aggregate([
    { $match: { supplierId: ObjectId(supplierId) } },
    { $project: { value: { $multiply: ['$currentStock', '$costPrice'] } } },
    { $group: { _id: null, total: { $sum: '$value' } } }
  ]);
  
  return {
    totalProducts,
    lowStockItems,
    outOfStockItems,
    inventoryValue: inventoryValue[0]?.total || 0,
    lowStockRate: totalProducts > 0 ? ((lowStockItems / totalProducts) * 100).toFixed(1) : 0,
    outOfStockRate: totalProducts > 0 ? ((outOfStockItems / totalProducts) * 100).toFixed(1) : 0
  };
}
