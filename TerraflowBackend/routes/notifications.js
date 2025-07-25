const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
  deleteNotification,
  deleteAllNotifications,
  deleteReadNotifications,
  deleteOldNotifications
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get('/', getUserNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete specific notification
router.delete('/:id', deleteNotification);

// Delete all notifications for current user (or specified user if admin)
router.delete('/', deleteAllNotifications);

// Delete only read notifications
router.delete('/read/clear', deleteReadNotifications);

// Delete old notifications (older than specified days)
router.delete('/old/cleanup', deleteOldNotifications);

// Create notification (admin only)
router.post('/', createNotification);

module.exports = router;
