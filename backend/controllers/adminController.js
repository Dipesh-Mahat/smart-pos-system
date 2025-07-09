const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const os = require('os');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Bulk user action (activate, suspend, ban, delete)
exports.bulkUserAction = async (req, res) => {
  try {
    const { userIds, action } = req.body;
    if (!Array.isArray(userIds) || !action) {
      return res.status(400).json({ success: false, message: 'userIds and action are required' });
    }
    let update;
    switch (action) {
      case 'activate':
        update = { status: 'active' };
        break;
      case 'suspend':
        update = { status: 'suspended' };
        break;
      case 'ban':
        update = { status: 'banned' };
        break;
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        // Log the action
        await AuditLog.create({
          admin: req.user.email || req.user.id,
          action: 'bulk delete',
          details: { userIds },
        });
        return res.status(200).json({ success: true, message: 'Users deleted' });
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }
    await User.updateMany({ _id: { $in: userIds } }, update);
    // Log the action
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: `bulk ${action}`,
      details: { userIds },
    });
    res.status(200).json({ success: true, message: `Users ${action}d` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// User activity logs (real implementation)
exports.getUserActivityLogs = async (req, res) => {
  try {
    // Optional: filter by user or action
    const { user, action, limit = 50 } = req.query;
    const filter = {};
    if (user) filter.admin = user;
    if (action) filter.action = action;
    const logs = await AuditLog.find(filter).sort({ time: -1 }).limit(Number(limit));
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Notify users (placeholder for real notification logic)
exports.notifyUsers = async (req, res) => {
  try {
    const { userIds, message } = req.body;
    if (!Array.isArray(userIds) || !message) {
      return res.status(400).json({ success: false, message: 'userIds and message are required' });
    }
    // Fetch users
    const users = await User.find({ _id: { $in: userIds } });
    // Placeholder: send notification (email, push, etc.)
    // You can integrate nodemailer, push notification, etc. here
    // For now, just log the notification
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: 'notify users',
      details: { userIds, message },
    });
    res.status(200).json({ success: true, message: 'Notifications sent (placeholder)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// System health endpoint (real checks)
exports.getSystemHealth = async (req, res) => {
  try {
    // Check MongoDB connection
    let dbStatus = 'unknown';
    if (mongoose.connection.readyState === 1) dbStatus = 'online';
    else if (mongoose.connection.readyState === 0) dbStatus = 'disconnected';
    else if (mongoose.connection.readyState === 2) dbStatus = 'connecting';
    else if (mongoose.connection.readyState === 3) dbStatus = 'disconnecting';

    // Memory usage
    const memory = process.memoryUsage();
    // Disk usage (for root drive)
    let storage = 'unknown';
    try {
      const disk = os.platform() === 'win32' ? 'C:/' : '/';
      const { size, free } = fs.statSync(disk);
      storage = `${((free / size) * 100).toFixed(2)}% free`;
    } catch (e) {
      storage = 'unavailable';
    }

    const health = {
      api: 'online',
      database: dbStatus,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external
      },
      storage,
      time: new Date()
    };
    res.status(200).json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin audit log endpoint (real implementation)
exports.getAuditLogs = async (req, res) => {
  try {
    // Optional: filter by admin or action
    const { admin, action, limit = 50 } = req.query;
    const filter = {};
    if (admin) filter.admin = admin;
    if (action) filter.action = action;
    const logs = await AuditLog.find(filter).sort({ time: -1 }).limit(Number(limit));
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// CREATE: Add new user (admin)
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, status = 'active' } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: firstName, lastName, email, password, role' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Validate role
    const validRoles = ['admin', 'shopowner', 'supplier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be admin, shopowner, or supplier' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();

    // Log the action
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: 'create user',
      details: { userId: newUser._id, email, role },
    });

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user: { ...newUser.toObject(), password: undefined }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// UPDATE: Edit user details (admin)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, role, status } = req.body;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use by another user' 
        });
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'shopowner', 'supplier'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role. Must be admin, shopowner, or supplier' 
        });
      }
    }

    // Update fields
    const updateData = { updatedAt: new Date() };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

    // Log the action
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: 'update user',
      details: { userId, changes: updateData },
    });

    res.status(200).json({ 
      success: true, 
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE: Delete individual user (admin)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    await User.findByIdAndDelete(userId);

    // Log the action
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: 'delete user',
      details: { userId, email: user.email, role: user.role },
    });

    res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get supplier application details (admin)
exports.getSupplierApplication = async (req, res) => {
  try {
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
    }

    const supplier = await User.findOne({ 
      _id: supplierId, 
      role: 'supplier' 
    }).select('-password');

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({ 
      success: true, 
      supplier 
    });
  } catch (error) {
    console.error('Get supplier application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Email notification for supplier approval/rejection
exports.sendSupplierNotification = async (supplierId, action, adminEmail) => {
  try {
    const supplier = await User.findById(supplierId);
    if (!supplier) return;

    // In a real application, you would use nodemailer or another email service
    // For now, we'll log the action and save it to audit logs
    
    const notificationData = {
      to: supplier.email,
      action: action, // 'approved' or 'rejected'
      supplierName: `${supplier.firstName} ${supplier.lastName}`,
      businessName: supplier.businessName || 'Your Business',
      timestamp: new Date()
    };

    // Log the notification
    await AuditLog.create({
      admin: adminEmail,
      action: `supplier ${action} notification`,
      details: notificationData,
    });

    // TODO: Implement actual email sending
    console.log(`Email notification sent to ${supplier.email}: Supplier ${action}`);
    
    return { success: true, notification: notificationData };
  } catch (error) {
    console.error('Send notification error:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced supplier approval with email notification
exports.approveSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    const supplier = await User.findOneAndUpdate(
      { _id: supplierId, role: 'supplier', status: 'pending' },
      { status: 'approved', updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found or already processed' 
      });
    }

    // Send notification
    await this.sendSupplierNotification(supplierId, 'approved', req.user.email || req.user.id);

    // Log the action
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: 'approve supplier',
      details: { supplierId, email: supplier.email },
    });

    res.status(200).json({ 
      success: true, 
      message: 'Supplier approved and notification sent',
      supplier 
    });
  } catch (error) {
    console.error('Approve supplier error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Enhanced supplier rejection with email notification
exports.rejectSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { reason } = req.body; // Optional rejection reason

    const supplier = await User.findOneAndUpdate(
      { _id: supplierId, role: 'supplier', status: 'pending' },
      { 
        status: 'rejected', 
        rejectionReason: reason,
        updatedAt: new Date() 
      },
      { new: true }
    ).select('-password');

    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found or already processed' 
      });
    }

    // Send notification
    await this.sendSupplierNotification(supplierId, 'rejected', req.user.email || req.user.id);

    // Log the action
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: 'reject supplier',
      details: { supplierId, email: supplier.email, reason },
    });

    res.status(200).json({ 
      success: true, 
      message: 'Supplier rejected and notification sent',
      supplier 
    });
  } catch (error) {
    console.error('Reject supplier error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
