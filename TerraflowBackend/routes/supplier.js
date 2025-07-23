const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getDashboardData,
  getMaterialRequests,
  updateRequestStatus,
  getDeliveryHistory,
  getForecastData,
  confirmDelivery
} = require('../controllers/supplierController');

const { authenticateToken, supplierOrAdmin } = require('../middleware/auth');

// Apply supplier authentication to all routes
router.use(authenticateToken, supplierOrAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardData);

// Material request routes
router.get('/requests', getMaterialRequests);
router.put('/requests/:requestId/status', [
  body('status').isIn(['pending', 'approved', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('supplier_response').optional().trim().isLength({ max: 1000 }).withMessage('Response must not exceed 1000 characters')
], updateRequestStatus);
router.put('/requests/:requestId/confirm-delivery', [
  body('delivery_notes').optional().trim().isLength({ max: 1000 }).withMessage('Delivery notes must not exceed 1000 characters'),
  body('delivery_date').optional().isISO8601().withMessage('Delivery date must be a valid date')
], confirmDelivery);

// History and forecast routes
router.get('/history', getDeliveryHistory);
router.get('/forecast', getForecastData);

module.exports = router;
