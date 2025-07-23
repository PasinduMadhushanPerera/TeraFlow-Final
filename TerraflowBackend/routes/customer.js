const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getDashboardData,
  getProducts,
  createOrder,
  getOrders,
  cancelOrder
} = require('../controllers/customerController');

const { authenticateToken, customerOrAdmin } = require('../middleware/auth');

// Apply customer authentication to all routes
router.use(authenticateToken, customerOrAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardData);

// Product routes
router.get('/products', getProducts);

// Order routes
router.get('/orders', getOrders);
router.post('/orders', [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('shipping_address').trim().isLength({ min: 10, max: 500 }).withMessage('Shipping address must be 10-500 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
], createOrder);
router.put('/orders/:orderId/cancel', cancelOrder);

module.exports = router;
