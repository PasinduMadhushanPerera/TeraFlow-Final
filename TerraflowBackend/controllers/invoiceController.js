const { pool } = require('../config/database');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs').promises;
const { triggerPaymentConfirmation } = require('./notificationController');

/**
 * Invoice Controller for managing invoices and payments
 */

// Generate invoice for an order
const generateInvoice = async (req, res) => {
  try {
    const { order_id } = req.params;

    // Get order details with customer info
    const [orderDetails] = await pool.execute(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.address as customer_address,
        u.mobile as customer_mobile
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `, [order_id]);

    if (orderDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderDetails[0];

    // Get order items
    const [orderItems] = await pool.execute(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.description as product_description,
        p.sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order_id]);

    // Check if invoice already exists
    const [existingInvoice] = await pool.execute(
      'SELECT id, invoice_number FROM invoices WHERE order_id = ?',
      [order_id]
    );

    let invoiceNumber;
    let invoiceId;

    if (existingInvoice.length > 0) {
      invoiceNumber = existingInvoice[0].invoice_number;
      invoiceId = existingInvoice[0].id;
    } else {
      // Generate invoice number
      invoiceNumber = `INV-${Date.now()}-${order_id}`;
      
      // Calculate amounts properly
      const orderItemsSubtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      const deliveryFee = parseFloat(order.delivery_fee || 0);
      const existingTaxAmount = parseFloat(order.tax_amount || 0);
      
      // If no existing tax, calculate it (5% of subtotal)
      const taxAmount = existingTaxAmount > 0 ? existingTaxAmount : orderItemsSubtotal * 0.05;
      
      // Total should be subtotal + delivery + tax
      const totalAmount = orderItemsSubtotal + deliveryFee + taxAmount;
      
      // Create invoice record
      const [invoiceResult] = await pool.execute(`
        INSERT INTO invoices 
        (order_id, invoice_number, amount, tax_amount, total_amount, due_date, status)
        VALUES (?, ?, ?, ?, ?, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'draft')
      `, [order_id, invoiceNumber, orderItemsSubtotal, taxAmount, totalAmount]);
      
      invoiceId = invoiceResult.insertId;
    }

    // Get updated invoice details
    const [invoice] = await pool.execute(
      'SELECT * FROM invoices WHERE id = ?',
      [invoiceId]
    );

    res.json({
      success: true,
      data: {
        invoice: invoice[0],
        order: order,
        order_items: orderItems,
        invoice_number: invoiceNumber
      },
      message: 'Invoice generated successfully'
    });

  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice'
    });
  }
};

// Generate PDF invoice
const generateInvoicePDF = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    // Get invoice with order and customer details
    const [invoiceData] = await pool.execute(`
      SELECT 
        i.*,
        o.order_number,
        o.shipping_address,
        o.delivery_fee,
        o.tax_amount as order_tax_amount,
        o.created_at as order_date,
        u.full_name as customer_name,
        u.email as customer_email,
        u.address as customer_address,
        u.mobile as customer_mobile
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN users u ON o.customer_id = u.id
      WHERE i.id = ?
    `, [invoice_id]);

    if (invoiceData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const invoice = invoiceData[0];

    // Get order items
    const [orderItems] = await pool.execute(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.description as product_description,
        p.sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.id = ?
    `, [invoice.order_id]);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('TerraFlow Clay Products', { align: 'center' });
    doc.fontSize(12).text('Supply Chain Management System', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice info
    doc.fontSize(10);
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 50, doc.y);
    doc.text(`Order Number: ${invoice.order_number}`, 300, doc.y - 12);
    doc.text(`Invoice Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 50, doc.y);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 300, doc.y - 12);
    doc.moveDown();

    // Customer details
    doc.text('Bill To:', 50, doc.y);
    doc.text(`${invoice.customer_name}`, 50, doc.y + 15);
    doc.text(`${invoice.customer_email}`, 50, doc.y + 15);
    doc.text(`${invoice.customer_address}`, 50, doc.y + 15);
    doc.text(`Phone: ${invoice.customer_mobile}`, 50, doc.y + 15);
    doc.moveDown();

    // Items table
    const tableTop = doc.y + 20;
    doc.text('Item', 50, tableTop);
    doc.text('SKU', 200, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 350, tableTop);
    doc.text('Total', 450, tableTop);

    // Table line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let itemY = tableTop + 25;
    orderItems.forEach(item => {
      doc.text(item.product_name, 50, itemY, { width: 140 });
      doc.text(item.sku || '-', 200, itemY);
      doc.text(item.quantity.toString(), 300, itemY);
      doc.text(`Rs. ${item.unit_price}`, 350, itemY);
      doc.text(`Rs. ${item.subtotal}`, 450, itemY);
      itemY += 20;
    });

    // Totals
    const totalsY = itemY + 20;
    doc.moveTo(350, totalsY).lineTo(550, totalsY).stroke();
    
    doc.text(`Subtotal: Rs. ${invoice.amount}`, 350, totalsY + 10);
    
    // Add delivery fee if available
    const deliveryFee = parseFloat(invoice.delivery_fee || 0);
    if (deliveryFee > 0) {
      doc.text(`Delivery Fee: Rs. ${deliveryFee.toFixed(2)}`, 350, totalsY + 30);
      doc.text(`Tax: Rs. ${invoice.tax_amount}`, 350, totalsY + 50);
      doc.fontSize(12).text(`Total: Rs. ${invoice.total_amount}`, 350, totalsY + 70);
    } else {
      doc.text(`Tax: Rs. ${invoice.tax_amount}`, 350, totalsY + 30);
      doc.fontSize(12).text(`Total: Rs. ${invoice.total_amount}`, 350, totalsY + 50);
    }

    // Footer
    doc.fontSize(8).text('Thank you for your business!', 50, doc.page.height - 100, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF invoice'
    });
  }
};

// Get all invoices (admin)
const getAllInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (status) {
      whereClause = 'WHERE i.status = ?';
      queryParams.push(status);
    }

    const [invoices] = await pool.execute(`
      SELECT 
        i.*,
        o.order_number,
        u.full_name as customer_name,
        u.email as customer_email
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN users u ON o.customer_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      ${whereClause}
    `, queryParams);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: countResult[0].total,
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
};

// Update invoice status
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const [result] = await pool.execute(
      'UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully'
    });

  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status'
    });
  }
};

// Create payment record
const createPayment = async (req, res) => {
  try {
    const { 
      order_id, 
      invoice_id, 
      amount, 
      payment_method,
      stripe_payment_intent_id,
      currency = 'USD'
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO payments 
      (order_id, invoice_id, amount, currency, payment_method, stripe_payment_intent_id, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [order_id, invoice_id, amount, currency, payment_method, stripe_payment_intent_id]);

    res.json({
      success: true,
      data: { payment_id: result.insertId },
      message: 'Payment record created successfully'
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment record'
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, stripe_status, failure_reason } = req.body;

    let updateFields = ['payment_status = ?'];
    let updateValues = [payment_status];

    if (stripe_status) {
      updateFields.push('stripe_status = ?');
      updateValues.push(stripe_status);
    }

    if (failure_reason) {
      updateFields.push('failure_reason = ?');
      updateValues.push(failure_reason);
    }

    if (payment_status === 'succeeded') {
      updateFields.push('paid_at = CURRENT_TIMESTAMP');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const [result] = await pool.execute(
      `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // If payment succeeded, update invoice and order status
    if (payment_status === 'succeeded') {
      const [payment] = await pool.execute(
        'SELECT p.invoice_id, p.order_id, p.amount, o.customer_id FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.id = ?', 
        [id]
      );
      
      if (payment.length > 0) {
        // Update invoice status
        if (payment[0].invoice_id) {
          await pool.execute(
            'UPDATE invoices SET status = "paid", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [payment[0].invoice_id]
          );
        }
        
        // Update order payment status
        await pool.execute(
          'UPDATE orders SET payment_status = "paid", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [payment[0].order_id]
        );

        // Send payment confirmation notification to customer
        await triggerPaymentConfirmation(
          payment[0].order_id, 
          payment[0].customer_id, 
          payment[0].amount
        );
      }
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const { order_id, customer_id } = req.query;
    
    let whereClause = '';
    let queryParams = [];

    if (order_id) {
      whereClause = 'WHERE p.order_id = ?';
      queryParams.push(order_id);
    } else if (customer_id) {
      whereClause = 'WHERE o.customer_id = ?';
      queryParams.push(customer_id);
    }

    const [payments] = await pool.execute(`
      SELECT 
        p.*,
        o.order_number,
        i.invoice_number,
        u.full_name as customer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      JOIN users u ON o.customer_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `, queryParams);

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

module.exports = {
  generateInvoice,
  generateInvoicePDF,
  getAllInvoices,
  updateInvoiceStatus,
  createPayment,
  updatePaymentStatus,
  getPaymentHistory
};
