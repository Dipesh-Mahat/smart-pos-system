const User = require('../models/User');
const Order = require('../models/Order');

// List customers (shopowners who ordered from this supplier)
exports.listCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', type = '', region = '' } = req.query;
    // Get all unique shop IDs that have ordered from this supplier
    const orderAggregation = [
      { $match: { supplierId: req.user._id } },
      { $group: { _id: '$shopId', totalOrders: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' }, lastOrderDate: { $max: '$orderDate' } } }
    ];
    const orderStats = await Order.aggregate(orderAggregation);
    const shopIds = orderStats.map(stat => stat._id);
    if (shopIds.length === 0) {
      return res.status(200).json({ success: true, customers: [], pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 } });
    }
    let userQuery = { _id: { $in: shopIds }, role: 'shopowner' };
    if (search) {
      userQuery.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) userQuery.status = status;
    if (type) userQuery.type = type;
    if (region) userQuery.region = region;
    const customers = await User.find(userQuery)
      .select('shopName firstName lastName email phone address status type region createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    const customersWithStats = customers.map(customer => {
      const stats = orderStats.find(stat => stat._id.toString() === customer._id.toString());
      return {
        ...customer,
        totalOrders: stats?.totalOrders || 0,
        totalSpent: stats?.totalAmount || 0,
        lastOrder: stats?.lastOrderDate || null
      };
    });
    const totalCustomers = await User.countDocuments(userQuery);
    res.status(200).json({
      success: true,
      customers: customersWithStats,
      pagination: {
        total: totalCustomers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCustomers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting supplier customers:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve customers' });
  }
};

// Get single customer details
exports.getCustomer = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'shopowner' });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve customer' });
  }
};

// Add a new customer (shopowner)
exports.addCustomer = async (req, res) => {
  try {
    const { shopName, firstName, lastName, email, phone, status, type, region, address } = req.body;
    const user = new User({ shopName, firstName, lastName, email, phone, status: status || 'active', type, region, address, role: 'shopowner' });
    await user.save();
    res.status(201).json({ success: true, message: 'Customer added successfully', customer: user });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ success: false, error: 'Failed to add customer' });
  }
};

// Update customer details
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'shopowner' },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.status(200).json({ success: true, message: 'Customer updated successfully', customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
};

// Toggle customer status (active/inactive)
exports.toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'shopowner' });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    customer.status = customer.status === 'active' ? 'inactive' : 'active';
    await customer.save();
    res.status(200).json({ success: true, message: 'Customer status updated', status: customer.status });
  } catch (error) {
    console.error('Error toggling customer status:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer status' });
  }
};

// Export customers (CSV)
exports.exportCustomers = async (req, res) => {
  try {
    const { search = '', status = '', type = '', region = '' } = req.query;
    let userQuery = { role: 'shopowner' };
    if (search) userQuery.$or = [
      { shopName: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    if (status) userQuery.status = status;
    if (type) userQuery.type = type;
    if (region) userQuery.region = region;
    const customers = await User.find(userQuery).select('shopName firstName lastName email phone status type region address').lean();
    let csv = 'Shop Name,First Name,Last Name,Email,Phone,Status,Type,Region,Address\n';
    customers.forEach(c => {
      csv += `${c.shopName || ''},${c.firstName || ''},${c.lastName || ''},${c.email || ''},${c.phone || ''},${c.status || ''},${c.type || ''},${c.region || ''},${c.address || ''}\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('customers.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting customers:', error);
    res.status(500).json({ success: false, error: 'Failed to export customers' });
  }
};
