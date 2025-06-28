const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// Get all customers for a shop
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', type = '' } = req.query;
    
    // Build query
    const query = { shopId: req.user._id };
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add type filter
    if (type) {
      query.type = type;
    }
    
    // Execute query with pagination
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalCustomers = await Customer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      customers,
      pagination: {
        total: totalCustomers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCustomers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve customers' });
  }
};

// Get a single customer
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve customer' });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      shopId: req.user._id
    };
    
    const customer = new Customer(customerData);
    await customer.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Customer created successfully', 
      customer 
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Customer updated successfully', 
      customer 
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Customer deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
};

// Bulk update customers
exports.bulkUpdateCustomers = async (req, res) => {
  try {
    const { customerIds, updateData } = req.body;
    
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer IDs array is required' 
      });
    }
    
    const result = await Customer.updateMany(
      { 
        _id: { $in: customerIds }, 
        shopId: req.user._id 
      },
      updateData,
      { runValidators: true }
    );
    
    res.status(200).json({ 
      success: true, 
      message: `${result.modifiedCount} customers updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating customers:', error);
    res.status(500).json({ success: false, error: 'Failed to update customers' });
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
  try {
    const shopId = req.user._id;
    
    // Get basic counts
    const totalCustomers = await Customer.countDocuments({ shopId });
    const activeCustomers = await Customer.countDocuments({ shopId, status: 'active' });
    const newCustomersThisMonth = await Customer.countDocuments({
      shopId,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    
    // Get top spending customers
    const topCustomers = await Customer.find({ shopId })
      .sort({ totalSpent: -1 })
      .limit(5)
      .select('name totalSpent totalOrders');
    
    // Get customer type distribution
    const typeDistribution = await Customer.aggregate([
      { $match: { shopId: mongoose.Types.ObjectId(shopId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        topCustomers,
        typeDistribution
      }
    });
  } catch (error) {
    console.error('Error getting customer stats:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve customer statistics' });
  }
};
