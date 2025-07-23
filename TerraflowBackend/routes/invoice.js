const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  generateInvoice,
  generateInvoicePDF,
  getAllInvoices,
  updateInvoiceStatus,
  createPayment,
  updatePaymentStatus,
  getPaymentHistory
} = require('../controllers/invoiceController');

// All invoice routes require authentication
router.use(authenticateToken);

// Invoice management routes (admin only)
router.post('/generate/:order_id', authorizeRole(['admin']), generateInvoice);
router.get('/pdf/:invoice_id', generateInvoicePDF);
router.get('/', authorizeRole(['admin']), getAllInvoices);
router.put('/:id/status', authorizeRole(['admin']), updateInvoiceStatus);

// Payment management routes
router.post('/payments', createPayment);
router.put('/payments/:id/status', updatePaymentStatus);
router.get('/payments', getPaymentHistory);

module.exports = router;
