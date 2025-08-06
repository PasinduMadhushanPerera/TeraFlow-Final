const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  createOrderFromCart,
  getCustomerOrders,
  getOrderDetails,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
  getOrderStatistics
} = require('../controllers/orderController');

const router = express.Router();

// Order validation middleware
const createOrderValidation = [
  body('shipping_address')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Shipping address must be between 10 and 500 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// Customer routes
router.post('/create-from-cart', authenticateToken, authorizeRole(['customer']), createOrderValidation, createOrderFromCart);
router.get('/my-orders', authenticateToken, authorizeRole(['customer']), getCustomerOrders);
router.get('/:orderId', authenticateToken, getOrderDetails);
router.post('/:orderId/cancel', authenticateToken, cancelOrder);

// Admin routes
router.get('/', authenticateToken, authorizeRole(['admin']), getAllOrders);
router.put('/:orderId/status', authenticateToken, authorizeRole(['admin']), updateOrderStatusValidation, updateOrderStatus);
router.get('/statistics/overview', authenticateToken, authorizeRole(['admin']), getOrderStatistics);

module.exports = router;
