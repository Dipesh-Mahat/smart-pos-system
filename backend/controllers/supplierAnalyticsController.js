const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/User');

// GET /supplier/analytics/summary
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const supplierId = req.user._id;
    // Revenue, Orders, Avg Order, New Customers
    const [
      revenueAgg,
      orderCount,
      avgOrderAgg,
      newCustomers
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { supplierId, status: { $in: ['completed', 'partially_refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments({ supplierId }),
      Transaction.aggregate([
        { $match: { supplierId, status: { $in: ['completed', 'partially_refunded'] } } },
        { $group: { _id: null, avg: { $avg: '$total' } } }
      ]),
      Customer.countDocuments({ role: 'shopowner', createdBy: supplierId })
    ]);
    res.json({
      totalRevenue: revenueAgg[0]?.total || 0,
      totalOrders: orderCount,
      avgOrder: avgOrderAgg[0]?.avg || 0,
      newCustomers
    });
  } catch (error) {
    console.error('Error in analytics summary:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics summary' });
  }
};

// GET /supplier/analytics/revenue-trend
exports.getRevenueTrend = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { period = 'month' } = req.query;
    let startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setDate(startDate.getDate() - 30);
    const trend = await Transaction.aggregate([
      { $match: { supplierId, status: { $in: ['completed', 'partially_refunded'] }, createdAt: { $gte: startDate } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
        total: { $sum: '$total' }
      } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    res.json({ trend });
  } catch (error) {
    console.error('Error in revenue trend:', error);
    res.status(500).json({ error: 'Failed to retrieve revenue trend' });
  }
};

// GET /supplier/analytics/orders-status
exports.getOrderStatusDistribution = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const statusDist = await Order.aggregate([
      { $match: { supplierId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ statusDist });
  } catch (error) {
    console.error('Error in order status distribution:', error);
    res.status(500).json({ error: 'Failed to retrieve order status distribution' });
  }
};

// GET /supplier/analytics/top-products
exports.getTopProducts = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { limit = 5 } = req.query;
    const topProducts = await Product.aggregate([
      { $match: { supplierId } },
      { $project: { name: 1, unitsSold: 1, revenue: 1, growth: 1, margin: 1 } },
      { $sort: { unitsSold: -1 } },
      { $limit: parseInt(limit) }
    ]);
    res.json({ topProducts });
  } catch (error) {
    console.error('Error in top products:', error);
    res.status(500).json({ error: 'Failed to retrieve top products' });
  }
};

// GET /supplier/analytics/customer-growth
exports.getCustomerGrowth = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const growth = await Order.aggregate([
      { $match: { supplierId } },
      { $group: {
        _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } },
        customers: { $addToSet: '$shopId' }
      } },
      { $project: { month: '$_id', count: { $size: '$customers' } } },
      { $sort: { 'month.year': 1, 'month.month': 1 } }
    ]);
    res.json({ growth });
  } catch (error) {
    console.error('Error in customer growth:', error);
    res.status(500).json({ error: 'Failed to retrieve customer growth' });
  }
};

// GET /supplier/analytics/reports
exports.getReports = async (req, res) => {
  try {
    // Placeholder: implement report generation logic
    res.json({ message: 'Report generation not implemented yet.' });
  } catch (error) {
    console.error('Error in reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
};
