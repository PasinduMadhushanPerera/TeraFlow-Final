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

const { generateInvoicePDF } = require('../controllers/invoiceController');

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

// Invoice routes for customers
router.get('/orders/:orderId/invoice', async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.id;
    
    // First, verify that this order belongs to the customer
    const { pool } = require('../config/database');
    const [orderCheck] = await pool.execute(
      'SELECT id FROM orders WHERE (id = ? OR order_number = ?) AND customer_id = ?',
      [orderId, orderId, customerId]
    );
    
    if (orderCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }
    
    const actualOrderId = orderCheck[0].id;
    
    // Check if invoice exists, if not create it
    const [existingInvoice] = await pool.execute(
      'SELECT id FROM invoices WHERE order_id = ?',
      [actualOrderId]
    );
    
    let invoiceId;
    if (existingInvoice.length === 0) {
      // Generate invoice
      const { generateInvoice } = require('../controllers/invoiceController');
      await generateInvoice({ params: { order_id: actualOrderId } }, { json: () => {} });
      
      // Get the newly created invoice
      const [newInvoice] = await pool.execute(
        'SELECT id FROM invoices WHERE order_id = ?',
        [actualOrderId]
      );
      invoiceId = newInvoice[0].id;
    } else {
      invoiceId = existingInvoice[0].id;
    }
    
    // Generate PDF
    req.params.invoice_id = invoiceId;
    return generateInvoicePDF(req, res);
    
  } catch (error) {
    console.error('Customer invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice'
    });
  }
});

module.exports = router;
