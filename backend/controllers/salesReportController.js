const Order = require('../models/Order');
const moment = require('moment');

// Helper to group orders by period
function groupOrders(orders, period) {
  const groups = {};
  orders.forEach(order => {
    let key;
    // Use orderDate if available, else fallback to createdAt
    const date = order.orderDate || order.createdAt;
    switch (period) {
      case 'day':
        key = moment(date).format('YYYY-MM-DD');
        break;
      case 'week':
        key = moment(date).startOf('isoWeek').format('YYYY-[W]WW');
        break;
      case 'month':
        key = moment(date).format('YYYY-MM');
        break;
      case 'year':
        key = moment(date).format('YYYY');
        break;
      default:
        key = moment(date).format('YYYY-MM-DD');
    }
    if (!groups[key]) groups[key] = 0;
    groups[key] += order.total || 0;
  });
  return groups;
}

exports.getSalesChart = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    // Fetch all completed/paid orders
    const orders = await Order.find({ status: { $in: ['completed', 'paid'] } });
    const grouped = groupOrders(orders, period);
    // Sort keys chronologically
    const labels = Object.keys(grouped).sort();
    const values = labels.map(label => grouped[label]);
    res.json({ labels, values });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales chart data.' });
  }
};
