const { pool } = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Advanced Order Management Controller
 * Handles complete order lifecycle with enhanced features
 */

// Enhanced order creation with validation and stock management
const createOrder = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { 
      items, 
      shipping_address, 
      billing_address,
      payment_method = 'pending',
      notes,
      delivery_date,
      priority = 'normal'
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validate all items and calculate total
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const [product] = await connection.execute(
          'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = true',
          [item.product_id]
        );

        if (product.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        if (product[0].stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product[0].name}. Available: ${product[0].stock_quantity}, Requested: ${item.quantity}`);
        }

        const subtotal = product[0].price * item.quantity;
        totalAmount += subtotal;

        validatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product[0].price,
          subtotal: subtotal,
          product_name: product[0].name
        });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${customerId}`;

      // Create order
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          customer_id, order_number, status, total_amount, 
          shipping_address, billing_address, payment_method,
          notes, delivery_date, priority
        ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
      `, [
        customerId, orderNumber, totalAmount,
        shipping_address, billing_address || shipping_address,
        payment_method, notes, delivery_date, priority
      ]);

      const orderId = orderResult.insertId;

      // Create order items and update inventory
      for (const item of validatedItems) {
        // Insert order item
        await connection.execute(`
          INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]);

        // Reserve stock (don't deduct until confirmed)
        await connection.execute(`
          UPDATE products 
          SET stock_quantity = stock_quantity - ? 
          WHERE id = ?
        `, [item.quantity, item.product_id]);

        // Log inventory movement
        await connection.execute(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, reference_type, reference_id, 
            notes, created_by
          ) VALUES (?, 'out', ?, 'order', ?, ?, ?)
        `, [
          item.product_id, item.quantity, orderId,
          `Order ${orderNumber} - ${item.product_name}`, customerId
        ]);
      }

      // Create notification for admin
      await connection.execute(`
        INSERT INTO notifications (
          user_id, type, title, message, related_id, related_type
        ) SELECT id, 'order_update', 'New Order Received', ?, ?, 'order'
        FROM users WHERE role = 'admin'
      `, [`New order ${orderNumber} received from customer`, orderId]);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order_id: orderId,
          order_number: orderNumber,
          total_amount: totalAmount.toFixed(2),
          status: 'pending'
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// Admin order approval system
const approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if order exists and is pending
      const [order] = await connection.execute(
        'SELECT id, status, customer_id, order_number FROM orders WHERE id = ? AND status = "pending"',
        [orderId]
      );

      if (order.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or already processed'
        });
      }

      // Update order status
      await connection.execute(`
        UPDATE orders 
        SET status = 'confirmed', notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [notes, orderId]);

      // Generate invoice
      await connection.execute(`
        INSERT INTO invoices (
          order_id, invoice_number, amount, total_amount, due_date, status
        ) SELECT 
          id, CONCAT('INV-', id, '-', UNIX_TIMESTAMP()), 
          total_amount, total_amount, 
          DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'draft'
        FROM orders WHERE id = ?
      `, [orderId]);

      // Notify customer
      await connection.execute(`
        INSERT INTO notifications (
          user_id, type, title, message, related_id, related_type
        ) VALUES (?, 'order_update', 'Order Approved', ?, ?, 'order')
      `, [
        order[0].customer_id,
        `Your order ${order[0].order_number} has been approved and is being processed`,
        orderId
      ]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Order approved successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve order'
    });
  }
};

// Reject order with stock restoration
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get order details
      const [order] = await connection.execute(
        'SELECT id, status, customer_id, order_number FROM orders WHERE id = ?',
        [orderId]
      );

      if (order.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (!['pending', 'confirmed'].includes(order[0].status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be rejected in current status'
        });
      }

      // Get order items to restore stock
      const [orderItems] = await connection.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );

      // Restore stock
      for (const item of orderItems) {
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Log inventory restoration
        await connection.execute(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, reference_type, reference_id,
            notes, created_by
          ) VALUES (?, 'in', ?, 'order', ?, ?, ?)
        `, [
          item.product_id, item.quantity, orderId,
          `Order ${order[0].order_number} rejected: ${reason}`,
          req.user.id
        ]);
      }

      // Update order status
      await connection.execute(
        'UPDATE orders SET status = "cancelled", notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [reason, orderId]
      );

      // Notify customer
      await connection.execute(`
        INSERT INTO notifications (
          user_id, type, title, message, related_id, related_type
        ) VALUES (?, 'order_update', 'Order Rejected', ?, ?, 'order')
      `, [
        order[0].customer_id,
        `Your order ${order[0].order_number} has been rejected. Reason: ${reason}`,
        orderId
      ]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Order rejected successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject order'
    });
  }
};

// Enhanced order tracking for customers
const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const customerId = req.user.role === 'customer' ? req.user.id : null;

    let query = `
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        i.invoice_number,
        i.status as invoice_status,
        p.payment_status
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN invoices i ON o.id = i.order_id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.order_number = ?
    `;

    const params = [orderNumber];

    if (customerId) {
      query += ' AND o.customer_id = ?';
      params.push(customerId);
    }

    const [orders] = await pool.execute(query, params);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const [orderItems] = await pool.execute(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.image_url,
        p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orders[0].id]);

    // Get order status history
    const [statusHistory] = await pool.execute(`
      SELECT 
        'Order Status Update' as event_type,
        status as new_status,
        notes,
        updated_at as event_date
      FROM orders 
      WHERE id = ?
      UNION ALL
      SELECT 
        'Inventory Movement' as event_type,
        CONCAT(movement_type, ' - ', quantity, ' units') as new_status,
        notes,
        created_at as event_date
      FROM inventory_movements 
      WHERE reference_type = 'order' AND reference_id = ?
      ORDER BY event_date DESC
    `, [orders[0].id, orders[0].id]);

    res.json({
      success: true,
      data: {
        order: orders[0],
        items: orderItems,
        history: statusHistory
      }
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track order'
    });
  }
};

// Get order analytics for admin dashboard
const getOrderAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Order statistics
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [parseInt(period)]);

    // Top selling products
    const [topProducts] = await pool.execute(`
      SELECT 
        p.name,
        p.category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.status NOT IN ('cancelled')
      GROUP BY p.id, p.name, p.category
      ORDER BY total_sold DESC
      LIMIT 10
    `, [parseInt(period)]);

    // Daily order trends
    const [dailyTrends] = await pool.execute(`
      SELECT 
        DATE(created_at) as order_date,
        COUNT(*) as order_count,
        SUM(total_amount) as daily_revenue
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status NOT IN ('cancelled')
      GROUP BY DATE(created_at)
      ORDER BY order_date DESC
    `, [parseInt(period)]);

    res.json({
      success: true,
      data: {
        overview: orderStats[0],
        top_products: topProducts,
        daily_trends: dailyTrends
      }
    });

  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order analytics'
    });
  }
};

module.exports = {
  createOrder,
  approveOrder,
  rejectOrder,
  trackOrder,
  getOrderAnalytics
};
