const { pool } = require('../config/database');

// Get customer dashboard data
const getDashboardData = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Get order statistics
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
        COALESCE(SUM(total_amount), 0) as total_spent
      FROM orders 
      WHERE customer_id = ?
    `, [customerId]);

    // Get recent orders
    const [recentOrders] = await pool.execute(`
      SELECT 
        id, order_number, status, total_amount, created_at
      FROM orders 
      WHERE customer_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [customerId]);

    res.json({
      success: true,
      data: {
        stats: orderStats[0],
        recentOrders
      }
    });

  } catch (error) {
    console.error('Get customer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// Get all products for customers
const getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        id, name, description, category, price, 
        stock_quantity, unit, image_url
      FROM products 
      WHERE is_active = true AND stock_quantity > 0
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const [products] = await pool.execute(query, params);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Create new order
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { items, shipping_address, notes } = req.body;
    const customerId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Calculate total amount and validate stock
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const [product] = await connection.execute(
        'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = true',
        [item.product_id]
      );

      if (product.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found or inactive`);
      }

      if (product[0].stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product[0].name}. Available: ${product[0].stock_quantity}`);
      }

      const subtotal = product[0].price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product[0].price,
        subtotal
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${customerId}`;

    // Create order
    const [orderResult] = await connection.execute(`
      INSERT INTO orders (
        customer_id, order_number, status, total_amount, 
        shipping_address, payment_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [customerId, orderNumber, 'pending', totalAmount, shipping_address, 'pending', notes]);

    const orderId = orderResult.insertId;

    // Create order items and update stock
    for (const item of orderItems) {
      // Insert order item
      await connection.execute(`
        INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]);

      // Update product stock
      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      // Log inventory movement
      await connection.execute(`
        INSERT INTO inventory_movements (
          product_id, movement_type, quantity, reference_type, 
          reference_id, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [item.product_id, 'out', item.quantity, 'order', orderId, `Order ${orderNumber}`, customerId]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  } finally {
    connection.release();
  }
};

// Get customer orders
const getOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, 
        o.shipping_address, o.payment_status, o.notes, 
        o.created_at, o.updated_at
      FROM orders o
      WHERE o.customer_id = ?
    `;
    const params = [customerId];

    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);

    // Get order items for each order
    for (const order of orders) {
      const [items] = await pool.execute(`
        SELECT 
          oi.*, p.name as product_name, p.unit
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { orderId } = req.params;
    const customerId = req.user.id;

    // Check if order exists and belongs to customer
    const [order] = await connection.execute(
      'SELECT id, status FROM orders WHERE id = ? AND customer_id = ?',
      [orderId, customerId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    // Get order items to restore stock
    const [orderItems] = await connection.execute(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );

    // Restore stock for each item
    for (const item of orderItems) {
      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      // Log inventory movement
      await connection.execute(`
        INSERT INTO inventory_movements (
          product_id, movement_type, quantity, reference_type, 
          reference_id, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [item.product_id, 'in', item.quantity, 'return', orderId, 'Order cancelled - stock restored', customerId]);
    }

    // Update order status
    await connection.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', orderId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getDashboardData,
  getProducts,
  createOrder,
  getOrders,
  cancelOrder
};
