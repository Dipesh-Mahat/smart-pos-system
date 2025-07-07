const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /supplier/dashboard/summary
exports.getSupplierDashboardSummary = async (req, res) => {
  try {
    const supplierId = req.user._id;

    // Quick Stats
    const [
      newOrders,
      totalRevenue,
      totalProducts,
      activeCustomers
    ] = await Promise.all([
      Order.countDocuments({ supplierId, status: 'pending' }),
      Order.aggregate([
        { $match: { supplierId, status: { $in: ['approved', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Product.countDocuments({ supplierId }),
      Order.distinct('shopId', { supplierId })
    ]);

    // Recent Orders
    const recentOrders = await Order.find({ supplierId })
      .sort({ orderDate: -1 })
      .limit(5)
      .populate('shopId', 'shopName')
      .lean();

    // Low Stock Alerts
    const lowStockProducts = await Product.find({ supplierId, $expr: { $lte: ['$stock', '$minStockLevel'] } })
      .select('name stock minStockLevel')
      .limit(5)
      .lean();

    // Key Insights (example: best seller, top region, avg rating, peak hours)
    // These would require more advanced aggregation, here are placeholders:
    const keyInsights = {
      bestSeller: 'Wireless Bluetooth Earbuds',
      bestSellerUnits: 145,
      topRegion: 'North America',
      topRegionPercent: 42,
      avgRating: 4.8,
      reviewCount: 234,
      peakHours: '2PM - 4PM',
      peakOrderVolume: 'Highest order volume'
    };

    res.json({
      stats: {
        newOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProducts,
        activeCustomers: activeCustomers.length
      },
      recentOrders,
      lowStockProducts,
      keyInsights
    });
  } catch (error) {
    console.error('Error in supplier dashboard summary:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier dashboard summary' });
  }
};
