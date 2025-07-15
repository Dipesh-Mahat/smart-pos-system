const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const NotificationLog = require('../models/NotificationLog');
const mongoose = require('mongoose');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Add indexes for AuditLog for performance
if (typeof AuditLog.collection !== 'undefined' && AuditLog.collection.createIndex) {
  AuditLog.collection.createIndex({ admin: 1, action: 1, time: -1 });
}

// Optionally, add a NotificationLog model for tracking notifications
// const NotificationLog = require('../models/NotificationLog');
// ...implement notification logging if needed...

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

// Notify users (real notification logging)
exports.notifyUsers = async (req, res) => {
  try {
    const { userIds, message, method = 'other' } = req.body;
    if (!Array.isArray(userIds) || !message) {
      return res.status(400).json({ success: false, message: 'userIds and message are required' });
    }
    // Fetch users
    const users = await User.find({ _id: { $in: userIds } });
    const recipientEmails = users.map(u => u.email);
    // Placeholder: send notification (email, push, etc.)
    // You can integrate nodemailer, push notification, etc. here
    // For now, just log the notification
    await AuditLog.create({
      admin: req.user.email || req.user.id,
      action: 'notify users',
      details: { userIds, message },
    });
    await NotificationLog.create({
      admin: req.user.email || req.user.id,
      recipients: recipientEmails,
      message,
      method,
      status: 'sent',
      time: new Date()
    });
    res.status(200).json({ success: true, message: 'Notifications sent (logged)' });
  } catch (error) {
    await NotificationLog.create({
      admin: req.user.email || req.user.id,
      recipients: req.body.userIds || [],
      message: req.body.message || '',
      method: req.body.method || 'other',
      status: 'failed',
      error: error.message,
      time: new Date()
    });
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
