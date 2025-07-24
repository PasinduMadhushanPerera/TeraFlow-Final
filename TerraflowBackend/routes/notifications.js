const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationStats
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

// Create notification (admin only)
router.post('/', createNotification);

module.exports = router;
