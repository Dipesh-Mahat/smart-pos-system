const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// Get dashboard summary data
exports.getDashboardSummary = async (req, res) => {
  try {
    // For testing without authentication, use any user
    const User = require('../models/User');
    const shopOwner = await User.findOne({ role: 'shopowner' });
    
    if (!shopOwner) {
      return res.status(404).json({ error: 'No shop owner found' });
    }
    
    const shopId = shopOwner._id;
    const { period = 'today' } = req.query;
    
    // Calculate date ranges based on period
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(now);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date(now);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        endDate = new Date(now);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    }
    
    // Sales summary aggregate pipeline
    const salesSummary = await Transaction.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'partially_refunded'] }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          transactionCount: { $sum: 1 },
          averageTicket: { $avg: '$total' }
        }
      }
    ]);
    
    // Expenses summary
    const expensesSummary = await Expense.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get low stock items count
    const lowStockCount = await Product.countDocuments({
      shopId: shopId,
      $expr: { $lte: ['$stock', '$minStockLevel'] }
    });
    
    // Get payment method breakdown
    const paymentMethodBreakdown = await Transaction.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'partially_refunded'] }
        }
      },
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.method',
          amount: { $sum: '$payments.amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          method: '$_id',
          amount: 1,
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({
      shopId: shopId,
      status: { $in: ['completed', 'partially_refunded', 'refunded'] }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Get sales over time (by day)
    const salesOverTime = await Transaction.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'partially_refunded'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          sales: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          sales: 1,
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // Calculate total items sold
    const totalItemsSold = await Transaction.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'partially_refunded'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' }
        }
      }
    ]);

    // Prepare response object in the format expected by frontend
    const salesData = salesSummary.length > 0 ? salesSummary[0] : {
      totalSales: 0,
      transactionCount: 0,
      averageTicket: 0
    };

    const itemsSoldData = totalItemsSold.length > 0 ? totalItemsSold[0] : { totalQuantity: 0 };

    const response = {
      success: true,
      // Simplified response for reports page
      totalSales: salesData.totalSales,
      transactionCount: salesData.transactionCount,
      totalItemsSold: itemsSoldData.totalQuantity,
      averageTicket: salesData.averageTicket,
      lowStockCount: lowStockCount,
      recentTransactions: recentTransactions,
      salesOverTime: salesOverTime,
      paymentMethodBreakdown: paymentMethodBreakdown,
      period: period,
      data: {
        todaySales: {
          amount: salesData.totalSales,
          count: salesData.transactionCount,
          percentChange: 0 // TODO: Calculate actual percentage change
        },
        todayOrders: {
          count: salesData.transactionCount,
          countChange: 0 // TODO: Calculate actual change
        },
        lowStock: {
          count: lowStockCount,
          critical: Math.min(lowStockCount, 3) // Assume critical if low stock
        },
        weeklyRevenue: {
          amount: salesData.totalSales, // For now, use today's sales as weekly
          percentChange: 0 // TODO: Calculate actual percentage change
        }
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard summary' });
  }
};

// Get top selling products
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Query for top selling products
    const topProducts = await Transaction.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(req.user._id),
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'partially_refunded'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          productId: '$_id',
          name: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          transactions: 1,
          _id: 0
        }
      }
    ]);
    
    // Get current stock levels for these products
    const productIds = topProducts.map(p => p.productId);
    const products = await Product.find({
      _id: { $in: productIds }
    }).select('_id stock');
    
    // Create a map for quick lookup
    const stockMap = {};
    products.forEach(p => {
      stockMap[p._id.toString()] = p.stock;
    });
    
    // Add stock levels to result
    const result = topProducts.map(p => ({
      ...p,
      currentStock: stockMap[p.productId.toString()] || 0
    }));
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting top selling products:', error);
    res.status(500).json({ error: 'Failed to retrieve top selling products' });
  }
};

// Get sales by category
exports.getSalesByCategory = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // First get product IDs and their categories
    const products = await Product.find({
      shopId: req.user._id
    }).select('_id category');
    
    // Create a map of product IDs to categories
    const categoryMap = {};
    products.forEach(product => {
      categoryMap[product._id.toString()] = product.category;
    });
    
    // Get sales data
    const transactions = await Transaction.find({
      shopId: req.user._id,
      createdAt: { $gte: startDate },
      status: { $in: ['completed', 'partially_refunded'] }
    }).select('items');
    
    // Process sales by category
    const categoryData = {};
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const productId = item.productId.toString();
        const category = categoryMap[productId] || 'Uncategorized';
        
        if (!categoryData[category]) {
          categoryData[category] = {
            category,
            totalSales: 0,
            totalQuantity: 0
          };
        }
        
        categoryData[category].totalSales += item.subtotal;
        categoryData[category].totalQuantity += item.quantity;
      });
    });
    
    // Convert to array and sort by sales
    const result = Object.values(categoryData).sort((a, b) => b.totalSales - a.totalSales);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting sales by category:', error);
    res.status(500).json({ error: 'Failed to retrieve sales by category' });
  }
};

// Get expense breakdown
exports.getExpenseBreakdown = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Get expense breakdown by category
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          totalAmount: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Get expenses over time
    const expensesOverTime = await Expense.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          totalAmount: 1,
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.status(200).json({
      expensesByCategory,
      expensesOverTime,
      period
    });
  } catch (error) {
    console.error('Error getting expense breakdown:', error);
    res.status(500).json({ error: 'Failed to retrieve expense breakdown' });
  }
};
