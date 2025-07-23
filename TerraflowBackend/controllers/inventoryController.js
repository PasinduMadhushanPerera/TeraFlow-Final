const { pool } = require('../config/database');
const { triggerLowStockAlert } = require('./notificationController');

/**
 * Enhanced Inventory Management Controller
 * Handles stock tracking, alerts, and inventory movements
 */

// Get comprehensive inventory overview
const getInventoryOverview = async (req, res) => {
  try {
    const { category, low_stock_only = false, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (low_stock_only === 'true') {
      whereClause += ' AND p.stock_quantity <= p.minimum_stock';
    }

    const [inventory] = await pool.execute(
      `SELECT 
         p.id,
         p.name,
         p.category,
         p.stock_quantity,
         p.minimum_stock,
         p.maximum_stock,
         p.reorder_point,
         p.reorder_quantity,
         p.cost_price,
         p.price,
         p.is_active,
         
         -- Stock status indicators
         CASE 
           WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
           WHEN p.stock_quantity <= p.minimum_stock THEN 'low_stock'
           WHEN p.stock_quantity >= p.maximum_stock THEN 'overstock'
           ELSE 'normal'
         END as stock_status,
         
         -- Stock value
         (p.stock_quantity * COALESCE(p.cost_price, p.price * 0.6)) as stock_value,
         
         -- Recent movements (last 30 days)
         COALESCE(SUM(CASE 
           WHEN im.movement_type = 'in' AND im.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           THEN im.quantity ELSE 0 
         END), 0) as stock_in_30d,
         
         COALESCE(SUM(CASE 
           WHEN im.movement_type = 'out' AND im.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           THEN im.quantity ELSE 0 
         END), 0) as stock_out_30d,
         
         -- Last movement date
         MAX(im.created_at) as last_movement_date
         
       FROM products p
       LEFT JOIN inventory_movements im ON p.id = im.product_id
       ${whereClause}
       GROUP BY p.id
       ORDER BY 
         CASE 
           WHEN p.stock_quantity <= 0 THEN 1
           WHEN p.stock_quantity <= p.minimum_stock THEN 2
           ELSE 3
         END,
         p.name
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );

    // Get summary statistics
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_products,
         SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock,
         SUM(CASE WHEN stock_quantity <= minimum_stock THEN 1 ELSE 0 END) as low_stock,
         SUM(CASE WHEN stock_quantity >= maximum_stock THEN 1 ELSE 0 END) as overstock,
         SUM(stock_quantity * COALESCE(cost_price, price * 0.6)) as total_inventory_value
       FROM products 
       WHERE is_active = true`
    );

    res.json({
      success: true,
      data: {
        inventory,
        statistics: stats[0],
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: countResult[0].total,
          total_pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get inventory overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory overview'
    });
  }
};

// Add inventory movement (stock in/out)
const addInventoryMovement = async (req, res) => {
  try {
    const {
      product_id,
      movement_type, // 'in' or 'out'
      quantity,
      reason,
      reference_id = null,
      reference_type = null, // 'order', 'purchase', 'adjustment', 'production'
      notes = null
    } = req.body;

    if (!product_id || !movement_type || !quantity || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: product_id, movement_type, quantity, reason'
      });
    }

    if (!['in', 'out'].includes(movement_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movement_type. Must be "in" or "out"'
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get current stock
      const [product] = await connection.execute(
        'SELECT stock_quantity, name, minimum_stock FROM products WHERE id = ?',
        [product_id]
      );

      if (product.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const currentStock = product[0].stock_quantity;
      const newStock = movement_type === 'in' 
        ? currentStock + quantity 
        : currentStock - quantity;

      // Check for negative stock
      if (newStock < 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock. Cannot reduce stock below zero.'
        });
      }

      // Update product stock
      await connection.execute(
        'UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE id = ?',
        [newStock, product_id]
      );

      // Add inventory movement record
      const [movementResult] = await connection.execute(
        `INSERT INTO inventory_movements 
         (product_id, movement_type, quantity, reason, reference_id, reference_type, 
          notes, previous_stock, new_stock, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          product_id, movement_type, quantity, reason, reference_id, 
          reference_type, notes, currentStock, newStock, req.user.id
        ]
      );

      await connection.commit();
      connection.release();

      // Check for low stock alert (only for stock out movements)
      if (movement_type === 'out' && newStock <= product[0].minimum_stock) {
        triggerLowStockAlert(product_id, newStock, product[0].minimum_stock);
      }

      res.status(201).json({
        success: true,
        message: 'Inventory movement recorded successfully',
        data: {
          id: movementResult.insertId,
          previous_stock: currentStock,
          new_stock: newStock
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Add inventory movement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record inventory movement'
    });
  }
};

// Get inventory movements history
const getInventoryMovements = async (req, res) => {
  try {
    const { 
      product_id, 
      movement_type, 
      page = 1, 
      limit = 20,
      date_from,
      date_to 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (product_id) {
      whereClause += ' AND im.product_id = ?';
      params.push(product_id);
    }

    if (movement_type) {
      whereClause += ' AND im.movement_type = ?';
      params.push(movement_type);
    }

    if (date_from) {
      whereClause += ' AND DATE(im.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(im.created_at) <= ?';
      params.push(date_to);
    }

    const [movements] = await pool.execute(
      `SELECT 
         im.*,
         p.name as product_name,
         p.category as product_category,
         u.full_name as created_by_username
       FROM inventory_movements im
       JOIN products p ON im.product_id = p.id
       LEFT JOIN users u ON im.created_by = u.id
       ${whereClause}
       ORDER BY im.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM inventory_movements im ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        movements,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: countResult[0].total,
          total_pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get inventory movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory movements'
    });
  }
};

// Bulk update stock levels
const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of {product_id, new_stock, reason}

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates data. Expected array of updates.'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const results = [];

      for (const update of updates) {
        const { product_id, new_stock, reason = 'Bulk adjustment' } = update;

        // Get current stock
        const [product] = await connection.execute(
          'SELECT stock_quantity, name, minimum_stock FROM products WHERE id = ?',
          [product_id]
        );

        if (product.length === 0) {
          results.push({
            product_id,
            success: false,
            message: 'Product not found'
          });
          continue;
        }

        const currentStock = product[0].stock_quantity;
        const quantity = new_stock - currentStock;
        const movement_type = quantity >= 0 ? 'in' : 'out';

        // Update stock
        await connection.execute(
          'UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE id = ?',
          [new_stock, product_id]
        );

        // Record movement
        await connection.execute(
          `INSERT INTO inventory_movements 
           (product_id, movement_type, quantity, reason, previous_stock, new_stock, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [product_id, movement_type, Math.abs(quantity), reason, currentStock, new_stock, req.user.id]
        );

        results.push({
          product_id,
          success: true,
          previous_stock: currentStock,
          new_stock
        });

        // Check for low stock alert
        if (new_stock <= product[0].minimum_stock) {
          triggerLowStockAlert(product_id, new_stock, product[0].minimum_stock);
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Bulk stock update completed',
        data: { results }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Bulk update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock levels'
    });
  }
};

// Get inventory alerts and recommendations
const getInventoryAlerts = async (req, res) => {
  try {
    const [alerts] = await pool.execute(
      `SELECT 
         p.id,
         p.name,
         p.category,
         p.stock_quantity,
         p.minimum_stock,
         p.maximum_stock,
         p.reorder_point,
         p.reorder_quantity,
         
         CASE 
           WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
           WHEN p.stock_quantity <= p.minimum_stock THEN 'low_stock'
           WHEN p.stock_quantity >= p.maximum_stock THEN 'overstock'
           ELSE 'normal'
         END as alert_type,
         
         CASE 
           WHEN p.stock_quantity <= 0 THEN 'URGENT: Product is out of stock'
           WHEN p.stock_quantity <= p.minimum_stock THEN 'WARNING: Stock below minimum level'
           WHEN p.stock_quantity >= p.maximum_stock THEN 'INFO: Overstock detected'
           ELSE 'OK'
         END as alert_message,
         
         -- Suggested reorder quantity
         CASE 
           WHEN p.stock_quantity <= p.reorder_point THEN 
             GREATEST(p.reorder_quantity, p.minimum_stock - p.stock_quantity)
           ELSE 0
         END as suggested_reorder
         
       FROM products p
       WHERE p.is_active = true 
         AND (p.stock_quantity <= p.minimum_stock OR p.stock_quantity >= p.maximum_stock)
       ORDER BY 
         CASE 
           WHEN p.stock_quantity <= 0 THEN 1
           WHEN p.stock_quantity <= p.minimum_stock THEN 2
           WHEN p.stock_quantity >= p.maximum_stock THEN 3
           ELSE 4
         END,
         p.stock_quantity ASC`
    );

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          total_alerts: alerts.length,
          out_of_stock: alerts.filter(a => a.alert_type === 'out_of_stock').length,
          low_stock: alerts.filter(a => a.alert_type === 'low_stock').length,
          overstock: alerts.filter(a => a.alert_type === 'overstock').length
        }
      }
    });
  } catch (error) {
    console.error('Get inventory alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory alerts'
    });
  }
};

// Generate inventory report
const generateInventoryReport = async (req, res) => {
  try {
    const { report_type = 'summary', date_from, date_to } = req.query;

    if (report_type === 'movements') {
      // Detailed movements report
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (date_from) {
        whereClause += ' AND DATE(im.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(im.created_at) <= ?';
        params.push(date_to);
      }

      const [movements] = await pool.execute(
        `SELECT 
           DATE(im.created_at) as movement_date,
           p.name as product_name,
           p.category,
           im.movement_type,
           im.quantity,
           im.reason,
           im.previous_stock,
           im.new_stock,
           u.full_name as created_by
         FROM inventory_movements im
         JOIN products p ON im.product_id = p.id
         LEFT JOIN users u ON im.created_by = u.id
         ${whereClause}
         ORDER BY im.created_at DESC`,
        params
      );

      return res.json({
        success: true,
        data: {
          report_type: 'movements',
          period: { date_from, date_to },
          movements
        }
      });
    }

    // Default summary report
    const [summary] = await pool.execute(
      `SELECT 
         p.category,
         COUNT(*) as total_products,
         SUM(p.stock_quantity) as total_stock,
         SUM(p.stock_quantity * COALESCE(p.cost_price, p.price * 0.6)) as total_value,
         SUM(CASE WHEN p.stock_quantity <= p.minimum_stock THEN 1 ELSE 0 END) as low_stock_items,
         AVG(p.stock_quantity) as avg_stock_level
       FROM products p
       WHERE p.is_active = true
       GROUP BY p.category
       ORDER BY total_value DESC`
    );

    const [overall] = await pool.execute(
      `SELECT 
         COUNT(*) as total_products,
         SUM(stock_quantity) as total_stock_units,
         SUM(stock_quantity * COALESCE(cost_price, price * 0.6)) as total_inventory_value,
         SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock,
         SUM(CASE WHEN stock_quantity <= minimum_stock THEN 1 ELSE 0 END) as low_stock,
         SUM(CASE WHEN stock_quantity >= maximum_stock THEN 1 ELSE 0 END) as overstock
       FROM products 
       WHERE is_active = true`
    );

    res.json({
      success: true,
      data: {
        report_type: 'summary',
        generated_at: new Date().toISOString(),
        overall_statistics: overall[0],
        category_breakdown: summary
      }
    });
  } catch (error) {
    console.error('Generate inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report'
    });
  }
};

module.exports = {
  getInventoryOverview,
  addInventoryMovement,
  getInventoryMovements,
  bulkUpdateStock,
  getInventoryAlerts,
  generateInventoryReport
};
