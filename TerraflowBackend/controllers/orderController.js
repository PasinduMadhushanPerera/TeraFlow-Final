const { pool } = require('../config/database');
const { validationResult } = require('express-validator');
const { triggerOrderStatusUpdate, triggerLowStockAlert } = require('./notificationController');

/**
 * Order Controller
 * Handles order management, checkout, and order tracking
 */

// Create order from cart
const createOrderFromCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { shipping_address, notes } = req.body;

    // Validate that cart has items
    const [cartItems] = await pool.execute(`
      SELECT 
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.stock_quantity,
        (c.quantity * p.price) as subtotal
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = ? AND p.is_active = true
    `, [customerId]);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Check stock availability
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${item.stock_quantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${customerId}`;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create order
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          customer_id, order_number, total_amount, shipping_address, notes
        ) VALUES (?, ?, ?, ?, ?)
      `, [customerId, orderNumber, totalAmount, shipping_address, notes]);

      const orderId = orderResult.insertId;

      // Create order items and update inventory
      for (const item of cartItems) {
        // Insert order item
        await connection.execute(`
          INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.price, item.subtotal]);

        // Update product stock
        await connection.execute(`
          UPDATE products 
          SET stock_quantity = stock_quantity - ? 
          WHERE id = ?
        `, [item.quantity, item.product_id]);

        // Log inventory movement
        await connection.execute(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, reference_type, reference_id, created_by
          ) VALUES (?, 'out', ?, 'order', ?, ?)
        `, [item.product_id, item.quantity, orderId, customerId]);
      }

      // Clear cart
      await connection.execute(
        'DELETE FROM cart WHERE customer_id = ?',
        [customerId]
      );

      await connection.commit();

      // Send notification to customer about order creation
      await triggerOrderStatusUpdate(customerId, orderId, 'confirmed', `Your order #${orderNumber} has been confirmed and is being processed.`);

      // Check for low stock and notify admin
      for (const item of cartItems) {
        const [stockCheck] = await pool.execute(
          'SELECT stock_quantity, minimum_stock, name FROM products WHERE id = ?',
          [item.product_id]
        );
        
        if (stockCheck[0] && stockCheck[0].stock_quantity <= stockCheck[0].minimum_stock) {
          // Get admin user ID (assuming first admin user)
          const [adminUser] = await pool.execute(
            'SELECT id FROM users WHERE role = "admin" ORDER BY id LIMIT 1'
          );
          
          if (adminUser[0]) {
            await triggerLowStockAlert(
              adminUser[0].id, 
              item.product_id, 
              stockCheck[0].name, 
              stockCheck[0].stock_quantity
            );
          }
        }
      }

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order_id: orderId,
          order_number: orderNumber,
          total_amount: totalAmount.toFixed(2)
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
      message: 'Failed to create order'
    });
  }
};

// Get customer orders
const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    let whereClause = 'WHERE customer_id = ?';
    const params = [customerId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [orders] = await pool.execute(`
      SELECT 
        id, order_number, status, total_amount, shipping_address,
        payment_status, created_at, updated_at
      FROM orders 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM orders ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current_page: parseInt(page),
          total_items: countResult[0].total,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.id;

    // Get order info
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = ? ${req.user.role !== 'admin' ? 'AND o.customer_id = ?' : ''}
    `, req.user.role !== 'admin' ? [orderId, customerId] : [orderId]);

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
        p.description as product_description,
        p.image_url,
        p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      success: true,
      data: {
        order: orders[0],
        items: orderItems
      }
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // Check if order exists
    const [existingOrder] = await pool.execute(
      'SELECT status, customer_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (existingOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await pool.execute(`
      UPDATE orders 
      SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, notes, orderId]);

    // Send notification to customer using our notification trigger
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being processed',
      approved: 'Your order has been approved and will be processed soon',
      processing: 'Your order is currently being processed',
      shipped: 'Your order has been shipped and is on the way',
      delivered: 'Your order has been delivered successfully',
      cancelled: 'Your order has been cancelled'
    };

    if (statusMessages[status]) {
      await triggerOrderStatusUpdate(
        existingOrder[0].customer_id, 
        orderId, 
        status, 
        statusMessages[status]
      );
    }

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      customer_id, 
      date_from, 
      date_to,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (customer_id) {
      whereClause += ' AND o.customer_id = ?';
      params.push(customer_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(o.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(o.created_at) <= ?';
      params.push(date_to);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.full_name, u.email
      ORDER BY o.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await pool.execute(`
      SELECT COUNT(DISTINCT o.id) as total 
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current_page: parseInt(page),
          total_items: countResult[0].total,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Check if order exists and can be cancelled
    const [order] = await pool.execute(`
      SELECT status, customer_id FROM orders WHERE id = ?
    `, [orderId]);

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && order[0].customer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order[0].status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in current status'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get order items to restore stock
      const [orderItems] = await connection.execute(`
        SELECT product_id, quantity FROM order_items WHERE order_id = ?
      `, [orderId]);

      // Restore stock for each item
      for (const item of orderItems) {
        await connection.execute(`
          UPDATE products 
          SET stock_quantity = stock_quantity + ? 
          WHERE id = ?
        `, [item.quantity, item.product_id]);

        // Log inventory movement
        await connection.execute(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, reference_type, reference_id, 
            notes, created_by
          ) VALUES (?, 'in', ?, 'order', ?, ?, ?)
        `, [item.product_id, item.quantity, orderId, `Order cancelled: ${reason}`, userId]);
      }

      // Update order status
      await connection.execute(`
        UPDATE orders 
        SET status = 'cancelled', notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [reason, orderId]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
};

// Get order statistics
const getOrderStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    const [stats] = await pool.execute(`
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

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
};

module.exports = {
  createOrderFromCart,
  getCustomerOrders,
  getOrderDetails,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
  getOrderStatistics
};
