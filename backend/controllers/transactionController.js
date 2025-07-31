const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
// Removed Customer model import as we're not tracking customers
const InventoryLog = require('../models/InventoryLog');
const mongoose = require('mongoose');

// Helper function to generate receipt number
const generateReceiptNumber = async (shopId) => {
  const today = new Date();
  const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
  
  // Find the last transaction for this shop with today's date prefix
  const lastTransaction = await Transaction.findOne({
    shopId,
    receiptNumber: { $regex: `^${datePrefix}` }
  }).sort({ receiptNumber: -1 });
  
  let sequenceNumber = 1;
  
  if (lastTransaction) {
    // Extract the sequence number from the last receipt and increment
    const lastSequence = parseInt(lastTransaction.receiptNumber.substring(datePrefix.length));
    sequenceNumber = lastSequence + 1;
  }
  
  // Format: YYYYMMDD0001
  return `${datePrefix}${sequenceNumber.toString().padStart(4, '0')}`;
};

// Create a new transaction (POS sale)
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(req.user._id);
    
    // Prepare transaction data
    const transactionData = {
      ...req.body,
      receiptNumber,
      shopId: req.user._id,
      cashierId: req.user._id,
      cashierName: req.user.name || 'Shop Staff'
    };
    
    // Create transaction
    const transaction = new Transaction(transactionData);
    
    // Calculate totals
    transaction.calculateTotals();
    
    // Save transaction
    await transaction.save({ session });
    
    // Update product stock levels
    for (const item of transaction.items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Product not found: ${item.name}` });
      }
      
      // Ensure we have enough stock
      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Insufficient stock for: ${product.name}` });
      }
      
      // Update stock
      const previousStock = product.stock;
      product.stock -= item.quantity;
      await product.save({ session });
      
      // Create inventory log
      const inventoryLog = new InventoryLog({
        shopId: req.user._id,
        productId: product._id,
        type: 'sale',
        quantity: -item.quantity,
        previousStock,
        newStock: product.stock,
        reference: 'Sale',
        referenceId: transaction._id,
        referenceModel: 'Transaction',
        performedBy: req.user._id      });
      
      await inventoryLog.save({ session });
    }
    
    // Customer tracking removed as we're not tracking customers in this version
    
    await session.commitTransaction();
    
    res.status(201).json(transaction);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating transaction:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    session.endSession();
  }
};

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    // For testing without authentication, use any user
    const User = require('../models/User');
    const shopOwner = await User.findOne({ role: 'shopowner' });
    
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'No shop owner found' });
    }
    
    const shopId = shopOwner._id;
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      customerId, 
      status,
      minAmount, 
      maxAmount, 
      paymentMethod 
    } = req.query;
    
    // Build query
    const query = { shopId: shopId };
    
    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }
    
    // Add customer filter
    if (customerId) {
      query.customerId = customerId;
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add amount range filter
    if (minAmount || maxAmount) {
      query.total = {};
      
      if (minAmount) {
        query.total.$gte = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        query.total.$lte = parseFloat(maxAmount);
      }
    }
    
    // Add payment method filter
    if (paymentMethod) {
      query['payments.method'] = paymentMethod;
    }
    
    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('customerId', 'name')
      .lean();
    
    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(query);
    
    // Return transactions with pagination data
    res.status(200).json({
      transactions,
      pagination: {
        total: totalTransactions,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalTransactions / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
};

// Get a single transaction
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      shopId: req.user._id
    })
      .populate('customerId', 'name email phone')
      .populate('cashierId', 'name');
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.status(200).json(transaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
};

// Void a transaction
exports.voidTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find transaction
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      shopId: req.user._id
    }).session(session);
    
    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Check if already voided
    if (transaction.status === 'voided') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Transaction is already voided' });
    }
    
    // Update transaction status
    transaction.status = 'voided';
    transaction.notes = req.body.reason || 'Transaction voided';
    await transaction.save({ session });
    
    // Restore product stock
    for (const item of transaction.items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (product) {
        const previousStock = product.stock;
        product.stock += item.quantity;
        await product.save({ session });
        
        // Create inventory log
        const inventoryLog = new InventoryLog({
          shopId: req.user._id,
          productId: product._id,
          type: 'return',
          quantity: item.quantity,
          previousStock,
          newStock: product.stock,
          reference: 'Void Transaction',
          referenceId: transaction._id,
          referenceModel: 'Transaction',
          notes: req.body.reason || 'Transaction voided',          performedBy: req.user._id
        });
        
        await inventoryLog.save({ session });
      }
    }
    
    // Customer tracking removed as we're not tracking customers in this version
    
    await session.commitTransaction();
    
    res.status(200).json({ message: 'Transaction voided successfully', transaction });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error voiding transaction:', error);
    res.status(500).json({ error: 'Failed to void transaction' });
  } finally {
    session.endSession();
  }
};

// Process a refund
exports.processRefund = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find transaction
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      shopId: req.user._id
    }).session(session);
    
    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Check if transaction can be refunded
    if (transaction.status === 'voided') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot refund a voided transaction' });
    }
    
    const { amount, reason, items } = req.body;
    
    // Validate refund amount
    if (!amount || isNaN(amount) || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid refund amount' });
    }
    
    // For partial refunds, ensure we have items
    if (amount < transaction.total && (!items || !items.length)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Item details required for partial refund' });
    }
    
    // For full refunds, amount should match transaction total
    if (amount > transaction.total) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Refund amount cannot exceed transaction total' });
    }
    
    // Calculate total refunded amount (including previous refunds)
    const totalRefunded = transaction.refunds ? 
      transaction.refunds.reduce((sum, refund) => sum + refund.amount, 0) + amount : 
      amount;
    
    // Update transaction status
    if (totalRefunded >= transaction.total) {
      transaction.status = 'refunded';
    } else {
      transaction.status = 'partially_refunded';
    }
    
    // Add refund record
    if (!transaction.refunds) {
      transaction.refunds = [];
    }
    
    transaction.refunds.push({
      amount,
      reason: reason || 'Customer request',
      date: new Date(),
      processedBy: req.user._id
    });
    
    await transaction.save({ session });
    
    // Process item returns if specified
    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        
        if (product) {
          const previousStock = product.stock;
          product.stock += item.quantity;
          await product.save({ session });
          
          // Create inventory log
          const inventoryLog = new InventoryLog({
            shopId: req.user._id,
            productId: product._id,
            type: 'return',
            quantity: item.quantity,
            previousStock,
            newStock: product.stock,
            reference: 'Refund',
            referenceId: transaction._id,
            referenceModel: 'Transaction',            notes: reason || 'Customer refund',
            performedBy: req.user._id
          });
          
          await inventoryLog.save({ session });
        }
      }
    }
    
    // Customer tracking removed as we're not tracking customers in this version
    
    await session.commitTransaction();
    
    res.status(200).json({ 
      message: 'Refund processed successfully', 
      transaction 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  } finally {
    session.endSession();
  }
};

// Get transaction summary for dashboard stats
exports.getTransactionSummary = async (req, res) => {
  try {
    // Use the logged-in user's ID as shopId (from JWT 'id')
    const shopId = req.user.id;
    
    // Get today's date range
    // Use UTC to avoid timezone issues
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);
    
    // Get all transactions for the shop
    const allTransactions = await Transaction.find({ shopId: shopId }).lean();
    // Get today's transactions (UTC)
    const todayTransactions = await Transaction.find({
      shopId: shopId,
      createdAt: { $gte: today, $lt: tomorrow }
    }).lean();

    // If no transactions found, try to force a refresh (workaround for DB/seed delay)
    let completedCount = allTransactions.filter(t => t.status === 'completed').length;
    let pendingCount = allTransactions.filter(t => t.status === 'pending').length;
    let totalSalesAmount = allTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.total, 0);
    let todayCount = todayTransactions.length;

    // If all stats are zero but transactions exist, recalculate from allTransactions (using UTC)
    if (
      completedCount === 0 &&
      pendingCount === 0 &&
      totalSalesAmount === 0 &&
      todayCount === 0 &&
      allTransactions.length > 0
    ) {
      completedCount = allTransactions.filter(t => t.status === 'completed').length;
      pendingCount = allTransactions.filter(t => t.status === 'pending').length;
      totalSalesAmount = allTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.total, 0);
      todayCount = allTransactions.filter(t => {
        const created = new Date(t.createdAt);
        return created >= today && created < tomorrow;
      }).length;
    }

    res.status(200).json({
      completedCount,
      pendingCount,
      totalSalesAmount,
      todayCount
    });
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    res.status(500).json({ 
      completedCount: 0,
      pendingCount: 0,
      totalSalesAmount: 0,
      todayCount: 0
    });
  }
};

// Get daily sales summary
exports.getDailySalesSummary = async (req, res) => {
  try {
    const { date } = req.query;
    let queryDate = date ? new Date(date) : new Date();
    
    // Set time to beginning of the day
    queryDate.setHours(0, 0, 0, 0);
    
    // Set end of day
    const endDate = new Date(queryDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Get all transactions for the day
    const transactions = await Transaction.find({
      shopId: req.user._id,
      createdAt: { $gte: queryDate, $lte: endDate },
      status: { $in: ['completed', 'partially_refunded'] }
    }).lean();
    
    // Calculate summary
    const summary = {
      date: queryDate,
      totalSales: 0,
      totalTransactions: transactions.length,
      averageTicket: 0,
      paymentMethods: {},
      hourlyBreakdown: Array(24).fill(0).map(() => ({ count: 0, amount: 0 })),
      topSellingItems: []
    };
    
    // Item sales tracking
    const itemSales = {};
    
    // Process transactions
    for (const transaction of transactions) {
      summary.totalSales += transaction.total;
      
      // Track payment methods
      for (const payment of transaction.payments) {
        if (!summary.paymentMethods[payment.method]) {
          summary.paymentMethods[payment.method] = 0;
        }
        summary.paymentMethods[payment.method] += payment.amount;
      }
      
      // Track hourly sales
      const hour = new Date(transaction.createdAt).getHours();
      summary.hourlyBreakdown[hour].count += 1;
      summary.hourlyBreakdown[hour].amount += transaction.total;
      
      // Track item sales
      for (const item of transaction.items) {
        const itemId = item.productId.toString();
        
        if (!itemSales[itemId]) {
          itemSales[itemId] = {
            productId: itemId,
            name: item.name,
            quantity: 0,
            total: 0
          };
        }
        
        itemSales[itemId].quantity += item.quantity;
        itemSales[itemId].total += item.subtotal;
      }
    }
    
    // Calculate average ticket
    summary.averageTicket = summary.totalTransactions > 0 
      ? summary.totalSales / summary.totalTransactions 
      : 0;
    
    // Get top selling items
    summary.topSellingItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting daily sales summary:', error);
    res.status(500).json({ error: 'Failed to retrieve daily sales summary' });
  }
};
