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
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Create notification (admin only)
router.post('/', createNotification);

module.exports = router;
