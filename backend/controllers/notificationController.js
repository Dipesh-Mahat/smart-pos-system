const NotificationLog = require('../models/NotificationLog');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// Get notifications for shop owner
exports.getNotifications = async (req, res) => {
  try {
    console.log('User object from JWT:', JSON.stringify(req.user, null, 2));
    
    const shopId = req.user.id || req.user._id; // Try both possible fields
    const { page = 1, limit = 10 } = req.query;
    
    // Ensure shopId exists
    if (!shopId) {
      console.error('Shop ID not found. User object:', req.user);
      return res.status(400).json({
        success: false,
        message: 'Shop ID not found in user data'
      });
    }
    
    console.log('Using shopId:', shopId);
    
    // Get notifications from different sources
    const notifications = [];
    
    // 1. Get low stock alerts
    const lowStockProducts = await Product.find({
      shopId: shopId,
      $expr: { $lte: ['$stock', '$minStockLevel'] },
      status: 'active'
    }).limit(5);
    
    lowStockProducts.forEach(product => {
      const isCritical = product.stock === 0;
      notifications.push({
        id: `stock-${product._id}`,
        type: isCritical ? 'critical' : 'warning',
        icon: isCritical ? 'exclamation-circle' : 'exclamation-triangle',
        title: isCritical ? 'Out of Stock' : 'Low Stock Alert',
        message: isCritical ? 
          `${product.name} is out of stock` : 
          `${product.name} - Only ${product.stock} ${product.unit || 'units'} left`,
        time: product.updatedAt || product.createdAt,
        unread: true,
        priority: isCritical ? 3 : 2,
        category: 'inventory'
      });
    });
    
    // 2. Get recent successful transactions
    const recentTransactions = await Transaction.find({
      shopId: shopId,
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .limit(3);
    
    recentTransactions.forEach(transaction => {
      notifications.push({
        id: `sale-${transaction._id}`,
        type: 'success',
        icon: 'check-circle',
        title: 'Sale Completed',
        message: `Transaction #${transaction.receiptNumber} - NPR ${transaction.total} processed successfully`,
        time: transaction.createdAt,
        unread: false,
        priority: 1,
        category: 'sales'
      });
    });
    
    // 3. Get notification logs (system notifications)
    const shopIdStr = shopId ? shopId.toString() : '';
    const userEmail = req.user.email || '';
    
    console.log('Fetching notifications for:', { shopId: shopIdStr, email: userEmail });
    
    const systemNotifications = await NotificationLog.find({
      recipients: { $in: [userEmail, shopIdStr] }
    })
    .sort({ time: -1 })
    .limit(5);
    
    systemNotifications.forEach(notification => {
      notifications.push({
        id: `system-${notification._id}`,
        type: notification.status === 'sent' ? 'info' : 'warning',
        icon: notification.method === 'email' ? 'envelope' : 'bell',
        title: 'System Notification',
        message: notification.message,
        time: notification.time,
        unread: notification.status === 'pending',
        priority: 1,
        category: 'system'
      });
    });
    
    // 4. Add daily reminder notifications
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if it's end of day (after 8 PM)
    if (now.getHours() >= 20) {
      const todayTransactions = await Transaction.countDocuments({
        shopId: shopId,
        createdAt: { $gte: todayStart }
      });
      
      if (todayTransactions > 0) {
        notifications.push({
          id: 'backup-reminder',
          type: 'info',
          icon: 'database',
          title: 'Daily Backup Reminder',
          message: `You had ${todayTransactions} transactions today. Don't forget to backup your data!`,
          time: new Date(),
          unread: true,
          priority: 1,
          category: 'system'
        });
      }
    }
    
    // Sort notifications by priority (critical first) and time
    notifications.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return new Date(b.time) - new Date(a.time); // Newer first
    });
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = notifications.slice(startIndex, endIndex);
    
    // Format time for display
    paginatedNotifications.forEach(notification => {
      notification.timeAgo = formatTimeAgo(notification.time);
    });
    
    res.status(200).json({
      success: true,
      notifications: paginatedNotifications,
      total: notifications.length,
      unreadCount: notifications.filter(n => n.unread).length,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: endIndex < notifications.length
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // For system notifications, update the NotificationLog
    if (notificationId.startsWith('system-')) {
      const logId = notificationId.replace('system-', '');
      await NotificationLog.findByIdAndUpdate(logId, { status: 'sent' });
    }
    
    // For other notification types, we would need to implement a user preferences system
    // For now, just return success
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read',
      error: error.message 
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const shopId = req.user._id;
    
    // Update all pending system notifications for this user
    await NotificationLog.updateMany(
      { 
        recipients: { $in: [req.user.email, shopId.toString()] },
        status: 'pending'
      },
      { status: 'sent' }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notifications as read',
      error: error.message 
    });
  }
};

// Create a new notification (for system use)
exports.createNotification = async (req, res) => {
  try {
    const { recipients, message, method = 'other' } = req.body;
    
    const notification = new NotificationLog({
      admin: req.user.email || req.user._id,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      message,
      method,
      status: 'sent',
      time: new Date()
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
    
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification',
      error: error.message 
    });
  }
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}

module.exports = exports;
