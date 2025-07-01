const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get user growth analytics (registrations per month, by role)
exports.getUserGrowth = async (req, res) => {
  try {
    // Get last 6 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleString('default', { month: 'short' })
      });
    }

    // Aggregate user counts per month by role
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      }
    ];
    const results = await User.aggregate(pipeline);

    // Format data for chart.js
    const roles = ['admin', 'shopowner', 'supplier'];
    const data = {};
    roles.forEach(role => data[role] = Array(6).fill(0));
    months.forEach((m, idx) => {
      results.forEach(r => {
        if (r._id.year === m.year && r._id.month === m.month) {
          data[r._id.role][idx] = r.count;
        }
      });
    });

    res.json({
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Total Users', data: roles.map(role => data[role]).reduce((a, b) => a.map((v, i) => v + b[i])), role: 'all' },
        { label: 'Shop Owners', data: data['shopowner'], role: 'shopowner' },
        { label: 'Suppliers', data: data['supplier'], role: 'supplier' }
      ]
    });
  } catch (error) {
    console.error('User growth analytics error:', error);
    res.status(500).json({ error: 'Failed to get user growth analytics' });
  }
};

// Get monthly revenue analytics (last 6 months)
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleString('default', { month: 'short' })
      });
    }
    // Aggregate revenue per month (completed/partially_refunded only)
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          },
          status: { $in: ['completed', 'partially_refunded'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' }
        }
      }
    ];
    const results = await Transaction.aggregate(pipeline);
    // Format data for chart.js
    const revenueData = Array(6).fill(0);
    months.forEach((m, idx) => {
      const found = results.find(r => r._id.year === m.year && r._id.month === m.month);
      if (found) revenueData[idx] = found.revenue;
    });
    res.json({
      labels: months.map(m => m.label),
      data: revenueData
    });
  } catch (error) {
    console.error('Monthly revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get monthly revenue analytics' });
  }
};

// Get user distribution (shop owners vs suppliers)
exports.getUserDistribution = async (req, res) => {
  try {
    const shopOwners = await User.countDocuments({ role: 'shopowner' });
    const suppliers = await User.countDocuments({ role: 'supplier' });
    res.json({
      labels: ['Shop Owners', 'Suppliers'],
      data: [shopOwners, suppliers]
    });
  } catch (error) {
    console.error('User distribution analytics error:', error);
    res.status(500).json({ error: 'Failed to get user distribution analytics' });
  }
};
