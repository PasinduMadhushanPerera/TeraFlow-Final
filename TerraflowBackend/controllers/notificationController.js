const { pool } = require('../config/database');

/**
 * Notification Management Controller
 * Handles system notifications for all user roles
 */

// Utility function to create notifications internally (not an API route)
const createNotificationUtil = async ({ user_id, type, title, message, related_type = null, related_id = null }) => {
  try {
    if (!user_id || !type || !title || !message) {
      throw new Error('Missing required fields: user_id, type, title, message');
    }

    const [result] = await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_type, related_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, type, title, message, related_type, related_id]
    );

    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Create notification utility error:', error);
    throw error;
  }
};

// Create a new notification (API route)
const createNotification = async (req, res) => {
  try {
    const { 
      user_id, 
      type, 
      title, 
      message, 
      related_type = null,
      related_id = null 
    } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, type, title, message'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_type, related_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, type, title, message, related_type, related_id]
    );

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (unread_only === 'true') {
      whereClause += ' AND is_read = FALSE';
    }

    const [notifications] = await pool.execute(
      `SELECT id, type, title, message, is_read, related_id, related_type, created_at
       FROM notifications 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      params
    );

    // Get unread count
    const [unreadResult] = await pool.execute(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: unreadResult[0].unread_count,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: countResult[0].total,
          total_pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as last_24h
       FROM notifications 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
};

// Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if notification exists and user has permission
    const [notification] = await pool.execute(
      'SELECT user_id FROM notifications WHERE id = ?',
      [id]
    );

    if (notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Allow users to delete their own notifications, or admins to delete any notification
    if (notification[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own notifications'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Delete all notifications for current user
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { user_id } = req.query; // Admin can specify user_id to delete for other users

    let targetUserId = userId;

    // Allow admins to delete notifications for other users
    if (userRole === 'admin' && user_id) {
      targetUserId = user_id;
    }

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE user_id = ?',
      [targetUserId]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} notifications deleted successfully`
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications'
    });
  }
};

// Delete read notifications only
const deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { user_id } = req.query; // Admin can specify user_id

    let targetUserId = userId;

    // Allow admins to delete notifications for other users
    if (userRole === 'admin' && user_id) {
      targetUserId = user_id;
    }

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
      [targetUserId]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} read notifications deleted successfully`
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete read notifications'
    });
  }
};

// Delete notifications older than specified days
const deleteOldNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { days = 30, user_id } = req.query;

    let targetUserId = userId;

    // Allow admins to delete notifications for other users
    if (userRole === 'admin' && user_id) {
      targetUserId = user_id;
    }

    // Validate days parameter
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Days parameter must be a positive number'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [targetUserId, daysNum]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} notifications older than ${daysNum} days deleted successfully`
    });
  } catch (error) {
    console.error('Delete old notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old notifications'
    });
  }
};

// System notification triggers
const triggerLowStockAlert = async (productId, currentStock, minimumStock) => {
  try {
    // Get admin users
    const [admins] = await pool.execute(
      'SELECT id FROM users WHERE role = ?', 
      ['admin']
    );

    // Get product details
    const [product] = await pool.execute(
      'SELECT name FROM products WHERE id = ?', 
      [productId]
    );

    if (product.length === 0) return;

    const title = '⚠️ Low Stock Alert';
    const message = `Product "${product[0].name}" is running low. Current stock: ${currentStock}, Minimum required: ${minimumStock}`;

    // Create notifications for all admins
    for (const admin of admins) {
      await pool.execute(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_type, related_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          admin.id, 
          'stock_alert', 
          title, 
          message, 
          'product',
          productId
        ]
      );
    }
  } catch (error) {
    console.error('Low stock alert error:', error);
  }
};

const triggerOrderStatusUpdate = async (orderId, newStatus, customerId) => {
  try {
    const title = '📦 Order Status Update';
    const message = `Your order #${orderId} status has been updated to: ${newStatus.toUpperCase()}`;
    
    await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_type, related_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        customerId, 
        'order_update', 
        title, 
        message, 
        'order',
        orderId
      ]
    );
  } catch (error) {
    console.error('Order status notification error:', error);
  }
};

const triggerPaymentConfirmation = async (orderId, customerId, amount) => {
  try {
    const title = '✅ Payment Confirmed';
    const message = `Payment of $${amount} for order #${orderId} has been successfully processed.`;
    
    await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_type, related_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        customerId, 
        'payment_reminder', 
        title, 
        message, 
        'payment',
        orderId
      ]
    );
  } catch (error) {
    console.error('Payment confirmation notification error:', error);
  }
};

const triggerSupplierDeliveryRequest = async (supplierId, materialRequestId, materialType, quantity, unit) => {
  try {
    const title = '📋 New Material Request';
    const message = `You have received a new material request for ${quantity} ${unit} of ${materialType}. Please review and respond.`;
    
    await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_type, related_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        supplierId, 
        'delivery_request', 
        title, 
        message, 
        'material_request',
        materialRequestId
      ]
    );
    
    console.log(`✅ Notification sent to supplier ${supplierId} for material request ${materialRequestId}`);
  } catch (error) {
    console.error('Supplier delivery request notification error:', error);
  }
};

module.exports = {
  createNotification,
  createNotificationUtil,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
  deleteNotification,
  deleteAllNotifications,
  deleteReadNotifications,
  deleteOldNotifications,
  // System triggers
  triggerLowStockAlert,
  triggerOrderStatusUpdate,
  triggerPaymentConfirmation,
  triggerSupplierDeliveryRequest
};
