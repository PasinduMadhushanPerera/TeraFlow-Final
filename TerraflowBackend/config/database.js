const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'terraflow_scm',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database and create tables
const initializeDatabase = async () => {
  try {
    const bcrypt = require('bcryptjs');
    const connection = await pool.getConnection();
      // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // Create enhanced users table with additional security fields
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role ENUM('admin', 'customer', 'supplier', 'guest') NOT NULL DEFAULT 'customer',
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        address TEXT,
        business_name VARCHAR(255),
        business_address TEXT,
        business_document VARCHAR(255),
        contact_no VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        email_verified_at TIMESTAMP NULL,
        login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        last_login TIMESTAMP NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expires TIMESTAMP NULL,
        registration_ip VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_active (is_active),
        INDEX idx_verified (is_verified)
      )
    `);

    // Create enhanced products table with better inventory management
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('raw_materials', 'finished_products', 'tools', 'packaging', 'chemicals') NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        minimum_stock INT NOT NULL DEFAULT 10,
        maximum_stock INT DEFAULT 1000,
        unit VARCHAR(50) DEFAULT 'pieces',
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(255),
        image_url VARCHAR(500),
        gallery_images JSON,
        weight_kg DECIMAL(5,2) DEFAULT NULL,
        dimensions VARCHAR(100) DEFAULT NULL,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        meta_title VARCHAR(255),
        meta_description TEXT,
        tags JSON,
        
        -- Clay-specific fields
        firing_temperature INT DEFAULT NULL,
        clay_type ENUM('earthenware', 'stoneware', 'porcelain', 'raw_clay') DEFAULT NULL,
        glaze_type VARCHAR(100) DEFAULT NULL,
        production_time_days INT DEFAULT NULL,
        is_custom_order BOOLEAN DEFAULT false,
        custom_order_lead_time INT DEFAULT NULL,
        
        -- Business fields
        cost_price DECIMAL(10,2) DEFAULT NULL,
        profit_margin DECIMAL(5,2) DEFAULT NULL,
        supplier_id INT DEFAULT NULL,
        reorder_point INT DEFAULT NULL,
        reorder_quantity INT DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_category (category),
        INDEX idx_active (is_active),
        INDEX idx_stock (stock_quantity),
        INDEX idx_featured (is_featured),
        INDEX idx_sku (sku),
        FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_customer (customer_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )
    `);

    // Create order_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_order (order_id),
        INDEX idx_product (product_id)
      )
    `);

    // Create material_requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS material_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        supplier_id INT NOT NULL,
        material_type VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit VARCHAR(50) NOT NULL,
        required_date DATE NOT NULL,
        description TEXT,
        status ENUM('pending', 'approved', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        admin_notes TEXT,
        supplier_response TEXT,
        requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_supplier (supplier_id),
        INDEX idx_status (status),
        INDEX idx_required_date (required_date)
      )
    `);

    // Create inventory_movements table for tracking stock changes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
        quantity INT NOT NULL,
        reference_type ENUM('order', 'purchase', 'adjustment', 'return') NOT NULL,
        reference_id INT,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_product (product_id),
        INDEX idx_type (movement_type),
        INDEX idx_created (created_at)
      )
    `);

    // Create suppliers_performance table for tracking supplier metrics
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS supplier_performance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        supplier_id INT NOT NULL,
        total_requests INT DEFAULT 0,
        completed_requests INT DEFAULT 0,
        cancelled_requests INT DEFAULT 0,
        avg_delivery_days DECIMAL(5,2),
        rating DECIMAL(3,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_supplier (supplier_id)
      )
    `);

    // Create clay_product_categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS clay_product_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create cart table for customer shopping cart
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_cart_item (customer_id, product_id),
        INDEX idx_customer (customer_id)
      )
    `);

    // Create invoices table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        due_date DATE NOT NULL,
        status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
        payment_method VARCHAR(50),
        payment_reference VARCHAR(100),
        pdf_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order (order_id),
        INDEX idx_status (status),
        INDEX idx_due_date (due_date)
      )
    `);

    // Create payments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        invoice_id INT,
        stripe_payment_intent_id VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
        stripe_status VARCHAR(50),
        failure_reason TEXT,
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
        INDEX idx_order (order_id),
        INDEX idx_stripe_id (stripe_payment_intent_id),
        INDEX idx_status (payment_status)
      )
    `);

    // Create production_recommendations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS production_recommendations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        recommended_quantity INT NOT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        reason TEXT,
        based_on_period_days INT DEFAULT 30,
        demand_forecast DECIMAL(10,2),
        current_stock INT,
        recommended_stock INT,
        profit_margin DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_implemented BOOLEAN DEFAULT false,
        implemented_at TIMESTAMP NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product (product_id),
        INDEX idx_priority (priority),
        INDEX idx_created (created_at)
      )
    `);

    // Create notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('order_update', 'stock_alert', 'payment_reminder', 'system_alert', 'supplier_update') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        related_id INT,
        related_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_type (type),
        INDEX idx_read (is_read)
      )
    `);

    // Insert default admin user
    const [adminExists] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@terraflow.com', 'admin']
    );

    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO users (role, full_name, email, password, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', 'System Administrator', 'admin@terraflow.com', hashedPassword, true, true]);
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@terraflow.com');
      console.log('   Password: admin123');
    }

    // Insert sample products
    const [productsExist] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (productsExist[0].count === 0) {
      const sampleProducts = [
        // Raw Materials
        ['Red Clay', 'High-quality red earthenware clay perfect for pottery', 'raw_materials', 1599.00, 500, 50, 'kg', 'RC001'],
        ['White Stoneware Clay', 'Premium white stoneware clay for fine ceramics', 'raw_materials', 2250.00, 300, 30, 'kg', 'WC001'],
        ['Porcelain Clay', 'Ultra-fine porcelain clay for delicate work', 'raw_materials', 3500.00, 200, 20, 'kg', 'PC001'],
        ['Clear Glaze', 'Food-safe clear glaze for functional pottery', 'raw_materials', 1899.00, 150, 15, 'liter', 'CG001'],
        ['Cobalt Blue Glaze', 'Rich cobalt blue decorative glaze', 'raw_materials', 2450.00, 100, 10, 'liter', 'CBG001'],
        ['Iron Oxide', 'Iron oxide for clay coloring and glazes', 'raw_materials', 1200.00, 75, 10, 'kg', 'IO001'],
        
        // Finished Products - Pottery
        ['Ceramic Dinner Plate Set', 'Handcrafted stoneware dinner plates (set of 4)', 'finished_products', 8999.00, 50, 5, 'set', 'CDP001'],
        ['Clay Coffee Mugs', 'Rustic earthenware coffee mugs', 'finished_products', 1299.00, 120, 15, 'pieces', 'CCM001'],
        ['Decorative Vase', 'Hand-thrown ceramic vase with blue glaze', 'finished_products', 4500.00, 30, 5, 'pieces', 'DV001'],
        ['Garden Planters', 'Large terracotta planters for outdoor use', 'finished_products', 3499.00, 80, 10, 'pieces', 'GP001'],
        ['Ceramic Bowls', 'Handcrafted serving bowls', 'finished_products', 2599.00, 75, 10, 'pieces', 'CB001'],
        ['Clay Teapot', 'Traditional clay teapot with bamboo handle', 'finished_products', 4200.00, 25, 3, 'pieces', 'CT001'],
        
        // Tools
        ['Pottery Wheel', 'Electric pottery wheel for professional use', 'tools', 89999.00, 5, 1, 'pieces', 'PW001'],
        ['Clay Tools Set', 'Complete set of pottery shaping tools', 'tools', 8999.00, 75, 5, 'set', 'CTS001'],
        ['Kiln Shelves', 'High-temperature kiln shelves', 'tools', 4500.00, 40, 5, 'pieces', 'KS001'],
        ['Wire Clay Cutter', 'Professional wire cutting tool', 'tools', 1599.00, 100, 10, 'pieces', 'WCC001'],
        
        // Packaging & Equipment
        ['Bubble Wrap', 'Protective packaging for ceramic products', 'packaging', 899.00, 200, 20, 'roll', 'BW001'],
        ['Ceramic Boxes', 'Specialized boxes for shipping pottery', 'packaging', 250.00, 500, 50, 'pieces', 'CB002'],
        ['Kiln Fire Bricks', 'Heat resistant fire bricks for kiln construction', 'tools', 350.00, 1000, 100, 'pieces', 'FB001']
      ];

      for (const product of sampleProducts) {
        await connection.execute(`
          INSERT INTO products (name, description, category, price, stock_quantity, minimum_stock, unit, sku)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, product);
      }
      console.log('✅ Clay products sample data inserted');
    }

    // Insert default clay product categories
    const [categoriesExist] = await connection.execute('SELECT COUNT(*) as count FROM clay_product_categories');
    if (categoriesExist[0].count === 0) {
      const categories = [
        ['Pottery & Ceramics', 'Handcrafted pottery and ceramic items for home and garden'],
        ['Raw Clay Materials', 'Various types of raw clay for pottery and ceramic production'],
        ['Glazes & Finishes', 'Professional glazes and finishing materials'],
        ['Pottery Tools', 'Professional tools for pottery and ceramic work'],
        ['Kilns & Equipment', 'Kilns, wheels, and other pottery equipment'],
        ['Decorative Items', 'Decorative clay products and artistic pieces'],
        ['Garden Products', 'Clay pots, planters, and garden accessories'],
        ['Dinnerware', 'Handcrafted clay dinnerware and tableware']
      ];

      for (const category of categories) {
        await connection.execute(`
          INSERT INTO clay_product_categories (name, description)
          VALUES (?, ?)
        `, category);
      }
      console.log('✅ Clay product categories inserted');
    }

    // Add missing columns to products table if they don't exist
    const [tableInfo] = await connection.execute(`DESCRIBE products`);
    const existingColumns = tableInfo.map(col => col.Field);
    
    const requiredColumns = [
      { name: 'maximum_stock', definition: 'INT DEFAULT 1000 AFTER minimum_stock' },
      { name: 'cost_price', definition: 'DECIMAL(10,2) DEFAULT NULL AFTER price' },
      { name: 'reorder_point', definition: 'INT DEFAULT NULL AFTER maximum_stock' },
      { name: 'reorder_quantity', definition: 'INT DEFAULT NULL AFTER reorder_point' }
    ];

    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        await connection.execute(`ALTER TABLE products ADD COLUMN ${column.name} ${column.definition}`);
        console.log(`✅ Added column ${column.name} to products table`);
      }
    }

    // Insert sample orders to demonstrate the system
    const [ordersExist] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    if (ordersExist[0].count === 0) {
      // First, create a customer user
      const customerPassword = await bcrypt.hash('customer123', 10);
      await connection.execute(`
        INSERT INTO users (role, full_name, email, password, is_active, is_verified, mobile, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['customer', 'John Smith', 'customer@example.com', customerPassword, true, true, '+1234567890', '123 Clay Street, Pottery City, PC 12345']);
      
      // Create a supplier user
      const supplierPassword = await bcrypt.hash('supplier123', 10);
      await connection.execute(`
        INSERT INTO users (role, full_name, email, password, business_name, business_address, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['supplier', 'Maria Garcia', 'supplier@clayworks.com', supplierPassword, 'ClayWorks Supply Co.', '456 Industrial Ave, Clay County, CC 67890', true, true]);

      // Get customer ID
      const [customer] = await connection.execute('SELECT id FROM users WHERE email = ?', ['customer@example.com']);
      const customerId = customer[0].id;

      // Create sample orders
      const sampleOrders = [
        {
          order_number: 'ORD-001',
          status: 'delivered',
          total_amount: 15896.00,
          shipping_address: '123 Clay Street, Pottery City, PC 12345',
          payment_status: 'paid'
        },
        {
          order_number: 'ORD-002', 
          status: 'processing',
          total_amount: 8999.00,
          shipping_address: '123 Clay Street, Pottery City, PC 12345',
          payment_status: 'paid'
        },
        {
          order_number: 'ORD-003',
          status: 'pending',
          total_amount: 23450.00,
          shipping_address: '123 Clay Street, Pottery City, PC 12345',
          payment_status: 'pending'
        }
      ];

      for (const order of sampleOrders) {
        const [orderResult] = await connection.execute(`
          INSERT INTO orders (customer_id, order_number, status, total_amount, shipping_address, payment_status)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [customerId, order.order_number, order.status, order.total_amount, order.shipping_address, order.payment_status]);

        // Add order items for each order
        const orderId = orderResult.insertId;
        
        // Get actual product IDs from database instead of using hard-coded values
        const [ceramicBowls] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['CB001']);
        const [redClay] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['RC001']);
        const [clayTools] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['CTS001']);
        const [clearGlaze] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['CG001']);
        const [whiteClay] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['WC001']);
        
        if (order.order_number === 'ORD-001' && ceramicBowls.length > 0 && redClay.length > 0) {
          await connection.execute(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `, [orderId, ceramicBowls[0].id, 4, 2599.00, 10396.00]); // Ceramic Bowls
          await connection.execute(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `, [orderId, redClay[0].id, 5, 1599.00, 7995.00]); // Red Clay
        } else if (order.order_number === 'ORD-002' && clayTools.length > 0) {
          await connection.execute(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `, [orderId, clayTools[0].id, 1, 8999.00, 8999.00]); // Clay Tools Set
        } else if (order.order_number === 'ORD-003' && clearGlaze.length > 0 && whiteClay.length > 0) {
          await connection.execute(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `, [orderId, clearGlaze[0].id, 2, 1899.00, 3798.00]); // Clear Glaze
          await connection.execute(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `, [orderId, whiteClay[0].id, 5, 2250.00, 11250.00]); // White Stoneware Clay
        }
      }

      console.log('✅ Sample orders and customers created');
    }

    // Insert sample production recommendations
    const [recommendationsExist] = await connection.execute('SELECT COUNT(*) as count FROM production_recommendations');
    if (recommendationsExist[0].count === 0) {
      // Get actual product IDs from database
      const [ceramicBowls] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['CB001']);
      const [redClay] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['RC001']);
      const [clayTools] = await connection.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', ['CTS001']);
      
      const recommendations = [];
      
      if (ceramicBowls.length > 0) {
        recommendations.push({
          product_id: ceramicBowls[0].id,
          recommended_quantity: 50,
          priority: 'high',
          reason: 'High demand detected, current stock below optimal level',
          current_stock: 146,
          recommended_stock: 200,
          profit_margin: 65.00
        });
      }
      
      if (redClay.length > 0) {
        recommendations.push({
          product_id: redClay[0].id,
          recommended_quantity: 200,
          priority: 'medium', 
          reason: 'Seasonal demand increase expected',
          current_stock: 500,
          recommended_stock: 700,
          profit_margin: 45.00
        });
      }
      
      if (clayTools.length > 0) {
        recommendations.push({
          product_id: clayTools[0].id,
          recommended_quantity: 25,
          priority: 'low',
          reason: 'Maintain steady inventory levels',
          current_stock: 75,
          recommended_stock: 100,
          profit_margin: 55.00
        });
      }

      for (const rec of recommendations) {
        await connection.execute(`
          INSERT INTO production_recommendations (product_id, recommended_quantity, priority, reason, current_stock, recommended_stock, profit_margin)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [rec.product_id, rec.recommended_quantity, rec.priority, rec.reason, rec.current_stock, rec.recommended_stock, rec.profit_margin]);
      }

      console.log('✅ Sample production recommendations created');
    }

    // Insert sample notifications
    const [notificationsExist] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    if (notificationsExist[0].count === 0) {
      // Get admin ID
      const [admin] = await connection.execute('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
      const adminId = admin[0].id;

      const notifications = [
        {
          type: 'stock_alert',
          title: 'Low Stock Alert',
          message: 'Ceramic Bowls inventory is running low. Consider restocking soon.',
          related_id: 4,
          related_type: 'product'
        },
        {
          type: 'order_update', 
          title: 'New Order Received',
          message: 'Order ORD-003 has been placed and is pending approval.',
          related_id: 3,
          related_type: 'order'
        },
        {
          type: 'system_alert',
          title: 'Production Recommendation',
          message: 'High-priority production recommendation available for Ceramic Bowls.',
          related_id: 1,
          related_type: 'production_recommendation'
        }
      ];

      for (const notif of notifications) {
        await connection.execute(`
          INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [adminId, notif.type, notif.title, notif.message, notif.related_id, notif.related_type]);
      }

      console.log('✅ Sample notifications created');
    }

    connection.release();
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
