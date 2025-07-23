const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getInventoryOverview,
  addInventoryMovement,
  getInventoryMovements,
  bulkUpdateStock,
  getInventoryAlerts,
  generateInventoryReport
} = require('../controllers/inventoryController');

// All inventory routes require authentication
router.use(authenticateToken);

// Admin-only routes
router.use(authorizeRole(['admin']));

// Inventory overview and statistics
router.get('/overview', getInventoryOverview);
router.get('/summary', getInventoryOverview); // Alias for overview

// Inventory alerts and notifications
router.get('/alerts', getInventoryAlerts);

// Inventory movements
router.get('/movements', getInventoryMovements);
router.post('/movements', addInventoryMovement);

// Bulk operations
router.put('/bulk-update', bulkUpdateStock);

// Reports
router.get('/reports', generateInventoryReport);

module.exports = router;
