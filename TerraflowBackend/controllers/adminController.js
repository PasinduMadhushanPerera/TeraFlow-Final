const db = require('../config/database');
const pool = db.pool;
const { validationResult } = require('express-validator');
const { getFileUrl, deleteUploadedFiles } = require('../middleware/upload');
const { triggerSupplierDeliveryRequest, triggerOrderStatusUpdate } = require('./notificationController');
const fs = require('fs');
const path = require('path');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT 
        id, role, full_name, email, mobile, address, 
        business_name, is_active, created_at
      FROM users 
      WHERE role != 'admin'
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get user counts
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as totalCustomers,
        SUM(CASE WHEN role = 'supplier' THEN 1 ELSE 0 END) as totalSuppliers
      FROM users WHERE role != 'admin'
    `);

    // Get product count
    const [productStats] = await pool.execute(`
      SELECT COUNT(*) as totalProducts FROM products WHERE is_active = true
    `);

    // Get order stats
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        COALESCE(SUM(total_amount), 0) as totalRevenue
      FROM orders
    `);

    res.json({
      success: true,
      data: {
        ...userStats[0],
        ...productStats[0],
        ...orderStats[0]
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    // Prevent deactivating admin users
    const [user] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin user status'
      });
    }

    await pool.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is admin
    const [user] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT * FROM products ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Create product with image upload support
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        deleteUploadedFiles(req.files);
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      category,
      price,
      stock_quantity,
      minimum_stock,
      unit,
      sku,
      is_active = true
    } = req.body;

    // Handle image uploads
    let imageUrl = null;
    let galleryImages = [];

    if (req.files) {
      // Handle main image
      if (req.files.image && req.files.image[0]) {
        imageUrl = getFileUrl(req.files.image[0].filename);
      }

      // Handle gallery images
      if (req.files.gallery_images && req.files.gallery_images.length > 0) {
        galleryImages = req.files.gallery_images.map(file => getFileUrl(file.filename));
      }
    } else if (req.file) {
      // Handle single file upload
      imageUrl = getFileUrl(req.file.filename);
    }

    const [result] = await pool.execute(`
      INSERT INTO products (
        name, description, category, price, stock_quantity, 
        minimum_stock, unit, sku, is_active, image_url, gallery_images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      description, 
      category, 
      price, 
      stock_quantity, 
      minimum_stock, 
      unit, 
      sku, 
      is_active,
      imageUrl,
      galleryImages.length > 0 ? JSON.stringify(galleryImages) : null
    ]);

    // Log inventory movement
    await pool.execute(`
      INSERT INTO inventory_movements (
        product_id, movement_type, quantity, reference_type, 
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [result.insertId, 'in', stock_quantity, 'adjustment', 'Initial stock', req.user.id]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { 
        id: result.insertId,
        image_url: imageUrl,
        gallery_images: galleryImages
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      deleteUploadedFiles(req.files);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

// Update product with image upload support
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      category,
      price,
      stock_quantity,
      minimum_stock,
      unit,
      sku,
      is_active,
      existing_main_image,
      existing_gallery_images
    } = req.body;

    // Get current product for image cleanup
    const [currentProduct] = await pool.execute(
      'SELECT image_url, gallery_images FROM products WHERE id = ?',
      [productId]
    );

    if (currentProduct.length === 0) {
      // Clean up uploaded files if product not found
      if (req.files) {
        deleteUploadedFiles(req.files);
      }
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let imageUrl = existing_main_image || currentProduct[0].image_url;
    let galleryImages = [];
    
    // Parse existing gallery images
    if (existing_gallery_images) {
      try {
        galleryImages = JSON.parse(existing_gallery_images);
      } catch (error) {
        galleryImages = currentProduct[0].gallery_images ? JSON.parse(currentProduct[0].gallery_images) : [];
      }
    } else {
      galleryImages = currentProduct[0].gallery_images ? JSON.parse(currentProduct[0].gallery_images) : [];
    }

    // Handle image uploads
    if (req.files) {
      // Handle new main image
      if (req.files.image && req.files.image[0]) {
        // Delete old main image if it's being replaced and not in existing_main_image
        if (currentProduct[0].image_url && currentProduct[0].image_url !== existing_main_image) {
          const oldImagePath = path.join(__dirname, '../uploads/products', path.basename(currentProduct[0].image_url));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        imageUrl = getFileUrl(req.files.image[0].filename);
      }

      // Handle new gallery images
      if (req.files.gallery_images && req.files.gallery_images.length > 0) {
        const newGalleryImages = req.files.gallery_images.map(file => getFileUrl(file.filename));
        galleryImages = [...galleryImages, ...newGalleryImages];
      }
    } else if (req.file) {
      // Handle single file upload (main image)
      if (currentProduct[0].image_url && currentProduct[0].image_url !== existing_main_image) {
        const oldImagePath = path.join(__dirname, '../uploads/products', path.basename(currentProduct[0].image_url));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = getFileUrl(req.file.filename);
    }

    // Clean up removed gallery images
    try {
      const oldGalleryImages = currentProduct[0].gallery_images ? JSON.parse(currentProduct[0].gallery_images) : [];
      const removedGalleryImages = oldGalleryImages.filter(img => !galleryImages.includes(img));
      
      removedGalleryImages.forEach(imgUrl => {
        if (imgUrl) {
          const imgPath = path.join(__dirname, '../uploads/products', path.basename(imgUrl));
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up gallery images:', error);
    }

    // Update main product table only (simplified)
    try {
      await pool.execute(`
        UPDATE products SET 
          name = ?, description = ?, category = ?, price = ?, 
          stock_quantity = ?, minimum_stock = ?, unit = ?, sku = ?, 
          is_active = ?, image_url = ?, gallery_images = ?
        WHERE id = ?
      `, [
        name, 
        description, 
        category, 
        price, 
        stock_quantity, 
        minimum_stock, 
        unit, 
        sku, 
        is_active !== undefined ? is_active : true,
        imageUrl,
        galleryImages.length > 0 ? JSON.stringify(galleryImages) : null,
        productId
      ]);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: {
          image_url: imageUrl,
          gallery_images: galleryImages
        }
      });

    } catch (dbError) {
      console.error('Database update error:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('Update product error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      deleteUploadedFiles(req.files);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const [product] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [productId]
    );

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await pool.execute('DELETE FROM products WHERE id = ?', [productId]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT 
        o.*, 
        u.full_name as customer_name, 
        u.email as customer_email
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    // Get order customer info for notification
    const [orderInfo] = await pool.execute(
      'SELECT customer_id, order_number FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Handle undefined notes by converting to null
    const notesValue = notes !== undefined ? notes : null;

    await pool.execute(
      'UPDATE orders SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notesValue, orderId]
    );

    // Send notification to customer using our notification trigger
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being processed',
      processing: 'Your order is currently being processed',
      shipped: 'Your order has been shipped and is on the way',
      delivered: 'Your order has been delivered successfully',
      cancelled: 'Your order has been cancelled'
    };

    if (statusMessages[status]) {
      // Check if customer exists before sending notification
      const [customerCheck] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [orderInfo[0].customer_id]
      );

      if (customerCheck.length > 0) {
        await triggerOrderStatusUpdate(
          orderInfo[0].customer_id, 
          orderId, 
          status, 
          statusMessages[status]
        );
      }
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

// Get order details with items
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const [order] = await pool.execute(`
      SELECT 
        o.*, 
        u.full_name as customer_name, 
        u.email as customer_email,
        u.mobile as customer_mobile
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (order.length === 0) {
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
        p.category as product_category,
        p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      success: true,
      data: {
        ...order[0],
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

// Get all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await pool.execute(`
      SELECT 
        u.*,
        sp.total_requests as material_requests,
        sp.completed_requests,
        sp.avg_delivery_days,
        COALESCE(sp.total_requests - sp.completed_requests, 0) as deliveries
      FROM users u
      LEFT JOIN supplier_performance sp ON u.id = sp.supplier_id
      WHERE u.role = 'supplier'
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: suppliers
    });

  } catch (error) {
    console.error('Get all suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
};

// Get all material requests
const getAllMaterialRequests = async (req, res) => {
  try {
    const [requests] = await pool.execute(`
      SELECT 
        mr.*,
        u.full_name as supplier_name,
        u.business_name
      FROM material_requests mr
      JOIN users u ON mr.supplier_id = u.id
      ORDER BY mr.created_at DESC
    `);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Get material requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material requests'
    });
  }
};

// Create material request
const createMaterialRequest = async (req, res) => {
  try {
    const {
      supplier_id,
      material_type,
      quantity,
      unit,
      required_date,
      description
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO material_requests (
        supplier_id, material_type, quantity, unit, 
        required_date, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [supplier_id, material_type, quantity, unit, required_date, description, 'pending']);

    const materialRequestId = result.insertId;

    // Update supplier performance
    await pool.execute(`
      INSERT INTO supplier_performance (supplier_id, total_requests) 
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE total_requests = total_requests + 1
    `, [supplier_id]);

    // Send notification to supplier about new material request
    await triggerSupplierDeliveryRequest(supplier_id, materialRequestId, material_type, quantity, unit);

    res.status(201).json({
      success: true,
      message: 'Material request created successfully',
      data: { id: materialRequestId }
    });

  } catch (error) {
    console.error('Create material request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create material request'
    });
  }
};

// Update material request status
const updateMaterialRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, admin_notes } = req.body;

    await pool.execute(`
      UPDATE material_requests 
      SET status = ?, admin_notes = ?, completed_date = ${status === 'completed' ? 'NOW()' : 'NULL'}
      WHERE id = ?
    `, [status, admin_notes, requestId]);

    // Update supplier performance if completed
    if (status === 'completed') {
      const [request] = await pool.execute(
        'SELECT supplier_id FROM material_requests WHERE id = ?',
        [requestId]
      );
      
      if (request.length > 0) {
        await pool.execute(`
          INSERT INTO supplier_performance (supplier_id, completed_requests) 
          VALUES (?, 1)
          ON DUPLICATE KEY UPDATE completed_requests = completed_requests + 1
        `, [request[0].supplier_id]);
      }
    }

    res.json({
      success: true,
      message: 'Material request updated successfully'
    });

  } catch (error) {
    console.error('Update material request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material request'
    });
  }
};

// Get inventory movements
const getInventoryMovements = async (req, res) => {
  try {
    const { productId } = req.query;
    let query = `
      SELECT 
        im.*,
        p.name as product_name,
        u.full_name as created_by_name
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      LEFT JOIN users u ON im.created_by = u.id
    `;
    
    const params = [];
    
    if (productId) {
      query += ' WHERE im.product_id = ?';
      params.push(productId);
    }
    
    query += ' ORDER BY im.created_at DESC LIMIT 100';

    const [movements] = await pool.execute(query, params);

    res.json({
      success: true,
      data: movements
    });

  } catch (error) {
    console.error('Get inventory movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory movements'
    });
  }
};

// Create inventory adjustment
const createInventoryAdjustment = async (req, res) => {
  try {
    const { product_id, adjustment_type, quantity, notes } = req.body;

    // Get current stock
    const [product] = await pool.execute(
      'SELECT stock_quantity FROM products WHERE id = ?',
      [product_id]
    );

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStock = product[0].stock_quantity;
    let newStock;

    if (adjustment_type === 'increase') {
      newStock = currentStock + quantity;
    } else {
      newStock = Math.max(0, currentStock - quantity);
    }

    // Update product stock
    await pool.execute(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [newStock, product_id]
    );

    // Log inventory movement
    await pool.execute(`
      INSERT INTO inventory_movements (
        product_id, movement_type, quantity, reference_type, 
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      product_id, 
      adjustment_type === 'increase' ? 'in' : 'out',
      quantity,
      'adjustment',
      notes,
      req.user.id
    ]);

    res.json({
      success: true,
      message: 'Inventory adjustment completed successfully',
      data: { newStock, previousStock: currentStock }
    });

  } catch (error) {
    console.error('Create inventory adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory adjustment'
    });
  }
};

// Get low stock alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const [alerts] = await pool.execute(`
      SELECT 
        id, name, category, stock_quantity, minimum_stock, sku,
        (minimum_stock - stock_quantity) as shortage,
        CASE 
          WHEN stock_quantity = 0 THEN 'Critical'
          WHEN stock_quantity <= minimum_stock * 0.5 THEN 'Very Low'
          WHEN stock_quantity <= minimum_stock THEN 'Low'
          ELSE 'Normal'
        END as alert_level
      FROM products 
      WHERE stock_quantity <= minimum_stock AND is_active = true
      ORDER BY (stock_quantity / minimum_stock) ASC
    `);

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock alerts'
    });
  }
};

// Get comprehensive analytics
const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Sales analytics
    const [salesData] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value
      FROM orders 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND status IN ('confirmed', 'processing', 'shipped', 'delivered')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [period]);

    // Product performance
    const [productPerformance] = await pool.execute(`
      SELECT 
        p.name,
        p.category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [period]);

    // Customer analytics
    const [customerAnalytics] = await pool.execute(`
      SELECT 
        u.role,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.customer_id 
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      WHERE u.role IN ('customer', 'supplier')
      GROUP BY u.role
    `, [period]);

    // Inventory analytics
    const [inventoryAnalytics] = await pool.execute(`
      SELECT 
        category,
        COUNT(*) as product_count,
        SUM(stock_quantity) as total_stock,
        SUM(stock_quantity * price) as inventory_value,
        COUNT(CASE WHEN stock_quantity <= minimum_stock THEN 1 END) as low_stock_count
      FROM products 
      WHERE is_active = true
      GROUP BY category
    `);

    res.json({
      success: true,
      data: {
        sales: salesData,
        productPerformance,
        customers: customerAnalytics,
        inventory: inventoryAnalytics
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

// Bulk update product prices
const bulkUpdateProductPrices = async (req, res) => {
  try {
    const { updates } = req.body; // Array of {id, price}
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const update of updates) {
        await connection.execute(
          'UPDATE products SET price = ? WHERE id = ?',
          [update.price, update.id]
        );
      }

      await connection.commit();
      
      res.json({
        success: true,
        message: `${updates.length} products updated successfully`
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Bulk update prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product prices'
    });
  }
};

// Get system notifications
const getSystemNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.execute(`
      SELECT 
        'low_stock' as type,
        CONCAT('Low stock alert: ', name) as title,
        CONCAT(name, ' has only ', stock_quantity, ' units left (minimum: ', minimum_stock, ')') as message,
        created_at,
        id as related_id
      FROM products 
      WHERE stock_quantity <= minimum_stock AND is_active = true
      
      UNION ALL
      
      SELECT 
        'pending_order' as type,
        CONCAT('Pending order #', id) as title,
        CONCAT('Order from ', (SELECT full_name FROM users WHERE id = customer_id), ' worth $', total_amount) as message,
        created_at,
        id as related_id
      FROM orders 
      WHERE status = 'pending' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Get reports data
const getReportsData = async (req, res) => {
  try {
    const { type } = req.query;

    let data = {};

    if (type === 'sales' || !type) {
      // Sales report
      const [salesData] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value
        FROM orders 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      data.sales = salesData;
    }

    if (type === 'inventory' || !type) {
      // Inventory report
      const [inventoryData] = await pool.execute(`
        SELECT 
          name,
          category,
          stock_quantity,
          minimum_stock,
          CASE 
            WHEN stock_quantity <= minimum_stock THEN 'Critical'
            WHEN stock_quantity <= minimum_stock * 2 THEN 'Low'
            ELSE 'Good'
          END as stock_status,
          (stock_quantity * price) as inventory_value
        FROM products
        WHERE is_active = true
        ORDER BY stock_quantity ASC
      `);
      data.inventory = inventoryData;
    }

    if (type === 'suppliers' || !type) {
      // Supplier report
      const [supplierData] = await pool.execute(`
        SELECT 
          u.full_name as supplier_name,
          u.business_name,
          u.email,
          sp.total_requests,
          sp.completed_requests,
          sp.avg_delivery_days,
          COALESCE(sp.total_requests - sp.completed_requests, 0) as total_deliveries
        FROM users u
        LEFT JOIN supplier_performance sp ON u.id = sp.supplier_id
        WHERE u.role = 'supplier' AND u.is_active = true
        ORDER BY sp.total_requests DESC
      `);
      data.suppliers = supplierData;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get reports data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports data'
    });
  }
};

// Export data for backup
const exportData = async (req, res) => {
  try {
    const { table } = req.query;
    
    let data = {};
    
    if (table === 'users' || !table) {
      const [users] = await pool.execute(`
        SELECT id, role, full_name, email, mobile, address, business_name, 
               is_active, created_at FROM users WHERE role != 'admin'
      `);
      data.users = users;
    }
    
    if (table === 'products' || !table) {
      const [products] = await pool.execute('SELECT * FROM products');
      data.products = products;
    }
    
    if (table === 'orders' || !table) {
      const [orders] = await pool.execute(`
        SELECT o.*, u.full_name as customer_name 
        FROM orders o 
        JOIN users u ON o.customer_id = u.id
      `);
      data.orders = orders;
    }

    res.json({
      success: true,
      data,
      exported_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
};

// Create new user (Admin only)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bcrypt = require('bcryptjs');
    const {
      full_name,
      email,
      password,
      mobile,
      address,
      business_name,
      role
    } = req.body;

    // Check if user already exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(`
      INSERT INTO users (
        role, full_name, email, password, mobile, address, 
        business_name, is_active, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [role, full_name, email, hashedPassword, mobile, address, business_name || null, true, true]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const {
      full_name,
      email,
      mobile,
      address,
      business_name,
      role,
      is_active
    } = req.body;

    // Check if user exists and is not admin
    const [user] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin user'
      });
    }

    // Check for email conflicts
    const [emailConflict] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (emailConflict.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists for another user'
      });
    }

    // Update user
    await pool.execute(`
      UPDATE users SET 
        full_name = ?, email = ?, mobile = ?, address = ?, 
        business_name = ?, role = ?, is_active = ?
      WHERE id = ?
    `, [full_name, email, mobile, address, business_name || null, role, is_active, userId]);

    res.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

module.exports = {
  getAllUsers,
  getDashboardStats,
  updateUserStatus,
  deleteUser,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails,
  getAllSuppliers,
  getAllMaterialRequests,
  createMaterialRequest,
  updateMaterialRequestStatus,
  getReportsData,
  createUser,
  updateUser,
  getInventoryMovements,
  createInventoryAdjustment,
  getLowStockAlerts,
  getAnalytics,
  bulkUpdateProductPrices,
  getSystemNotifications,
  exportData
};
