const { pool } = require('../config/database');

// Helper function to get sample images for categories
const getSampleImagesForCategory = (category) => {
  const sampleImages = {
    'raw_materials': [
      'product-1751996152203-415241586.png',
      'product-1752059935855-342658321.jpg',
      'product-1752059935865-863683913.jpg'
    ],
    'finished_products': [
      'product-1752059935871-29042072.webp',
      'product-1752059935872-486951310.jpg',
      'product-1752059935879-361276407.jpg'
    ],
    'tools': [
      'product-1752059935880-156882767.jpg',
      'product-1753389463170-608121192.webp',
      'product-1753389463212-880955216.jpg'
    ],
    'packaging': [
      'product-1753389463251-40647797.jpg',
      'product-1753389463260-60626732.jpg',
      'product-1753389668802-810427402.jpg'
    ]
  };
  
  return sampleImages[category] || sampleImages['finished_products'];
};

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
        stock_quantity, minimum_stock, unit, sku, image_url, 
        is_active, clay_type, dimensions, firing_temperature,
        weight_kg, production_time_days, glaze_type
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

    console.log('Raw products from database:', products.length);
    if (products.length > 0) {
      console.log('Sample product:', products[0]);
    }

    // Format image URLs to include full server path and create multiple images per product
    const formattedProducts = products.map(product => {
      // Use actual database image URLs - prioritize database images
      let primaryImageUrl = null;
      
      // If the product has a database image, use it with full server path
      if (product.image_url) {
        if (product.image_url.startsWith('http')) {
          primaryImageUrl = product.image_url;
        } else {
          primaryImageUrl = `http://localhost:5000${product.image_url}`;
        }
      }
      
      // Create multiple images for carousel - assign 2-4 images per product
      const categoryImageSets = {
        'raw_materials': [
          '/uploads/products/product-1751996152203-415241586.png',
          '/uploads/products/product-1752059935855-342658321.jpg',
          '/uploads/products/product-1752059935865-863683913.jpg'
        ],
        'finished_products': [
          '/uploads/products/product-1752059935871-29042072.webp',
          '/uploads/products/product-1752059935872-486951310.jpg',
          '/uploads/products/product-1752059935879-361276407.jpg',
          '/uploads/products/product-1753520500155-346325479.webp',
          '/uploads/products/product-1753520500156-668581329.jpg',
          '/uploads/products/product-1753520500165-100157489.jpg'
        ],
        'tools': [
          '/uploads/products/product-1752059935880-156882767.jpg',
          '/uploads/products/product-1753389463170-608121192.webp',
          '/uploads/products/product-1753389463212-880955216.jpg',
          '/uploads/products/product-1753522614821-996075903.jpg',
          '/uploads/products/product-1753522614835-10788241.webp'
        ],
        'packaging': [
          '/uploads/products/product-1753389463251-40647797.jpg',
          '/uploads/products/product-1753389463260-60626732.jpg',
          '/uploads/products/product-1753389668802-810427402.jpg',
          '/uploads/products/product-1753389668803-818926462.jpg'
        ],
        'chemicals': [
          '/uploads/products/product-1753520418983-431755433.jpg',
          '/uploads/products/product-1753520419009-562194273.webp',
          '/uploads/products/product-1753522646102-879295014.jpg'
        ]
      };

      // Get images for this product's category
      const categoryImages = categoryImageSets[product.category] || categoryImageSets['finished_products'];
      
      // Create 2-4 images per product using different images from the category
      const numImages = 2 + (product.id % 3); // 2-4 images
      const productImages = [];
      
      // Always include the primary image first if it exists
      if (primaryImageUrl) {
        productImages.push({
          image_url: primaryImageUrl,
          image_alt: product.name,
          display_order: 0,
          is_primary: true
        });
      }
      
      // Add additional images from category set
      for (let i = 1; i < numImages; i++) {
        const imageIndex = (product.id + i - 1) % categoryImages.length;
        const imageUrl = `http://localhost:5000${categoryImages[imageIndex]}`;
        
        // Don't duplicate the primary image
        if (imageUrl !== primaryImageUrl) {
          productImages.push({
            image_url: imageUrl,
            image_alt: `${product.name} - Image ${i + 1}`,
            display_order: i,
            is_primary: false
          });
        }
      }
      
      // If no primary image from database, use fallback
      if (!primaryImageUrl) {
        console.log(`⚠️ No database image for product ${product.id}: ${product.name}`);
        const fallbackImages = {
          'packaging': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop',
          'finished_products': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
          'tools': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
          'raw_materials': 'https://images.unsplash.com/photo-1594736797933-d0d2a2752ba9?w=300&h=200&fit=crop'
        };
        primaryImageUrl = fallbackImages[product.category] || fallbackImages['finished_products'];
      }
      
      // Create imageUrls array for backward compatibility
      const imageUrls = productImages.map(img => img.image_url);
      
      return {
        ...product,
        price: parseFloat(product.price) || 0,
        stock_quantity: parseInt(product.stock_quantity) || 0,
        minimum_stock: parseInt(product.minimum_stock) || 0,
        firing_temperature: product.firing_temperature ? parseInt(product.firing_temperature) : null,
        weight_kg: product.weight_kg ? parseFloat(product.weight_kg) : null,
        production_time_days: product.production_time_days ? parseInt(product.production_time_days) : null,
        image_url: primaryImageUrl,
        primary_image: primaryImageUrl,
        images: productImages,
        image_urls: imageUrls,
        has_multiple_images: productImages.length > 1
      };
    });

    console.log('Sample formatted product:', formattedProducts[0]);
    if (formattedProducts.length > 0) {
      console.log('Generated image URLs:', formattedProducts[0]?.image_urls);
    }

    res.json({
      success: true,
      data: formattedProducts
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

    const { 
      items, 
      shipping_address, 
      notes, 
      customer_info,
      payment_method,
      subtotal,
      shipping_cost = 250, // Default shipping cost
      total_amount: providedTotal
    } = req.body;
    const customerId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Calculate total amount and validate stock
    let calculatedSubtotal = 0;
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

      const itemSubtotal = product[0].price * item.quantity;
      calculatedSubtotal += itemSubtotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product[0].price,
        subtotal: itemSubtotal
      });
    }

    // Calculate delivery fee and total
    const deliveryFee = parseFloat(shipping_cost) || 250;
    const taxRate = 0.05; // 5% tax
    const taxAmount = calculatedSubtotal * taxRate;
    const finalTotalAmount = calculatedSubtotal + deliveryFee + taxAmount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${customerId}`;

    // Create order with proper amounts
    const [orderResult] = await connection.execute(`
      INSERT INTO orders (
        customer_id, customer_name, customer_email, customer_phone,
        order_number, status, total_amount, delivery_fee, tax_amount,
        shipping_address, payment_status, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId, 
      customer_info?.fullName || null,
      customer_info?.email || null, 
      customer_info?.phone || null,
      orderNumber, 
      'pending', 
      finalTotalAmount, 
      deliveryFee,
      taxAmount,
      shipping_address, 
      'pending', 
      payment_method || 'cash_on_delivery',
      notes
    ]);

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
        subtotal: calculatedSubtotal,
        delivery_fee: deliveryFee,
        tax_amount: taxAmount,
        total_amount: finalTotalAmount
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
        o.delivery_fee, o.tax_amount,
        o.payment_method, o.payment_status,
        o.shipping_address, o.notes as special_instructions, 
        o.customer_name, o.customer_email, o.customer_phone,
        o.created_at, o.updated_at,
        (o.total_amount - COALESCE(o.delivery_fee, 0) - COALESCE(o.tax_amount, 0)) as subtotal
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

    // Get order items for each order and calculate totals
    for (const order of orders) {
      const [items] = await pool.execute(`
        SELECT 
          oi.*, p.name as product_name, p.unit, p.sku as product_sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
      
      // Calculate proper breakdown
      const itemsSubtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
      order.subtotal = itemsSubtotal;
      order.shipping_cost = parseFloat(order.delivery_fee || 0);
      order.tax_amount = parseFloat(order.tax_amount || 0);
      
      // Ensure total_amount includes all components
      const calculatedTotal = order.subtotal + order.shipping_cost + order.tax_amount;
      if (Math.abs(calculatedTotal - parseFloat(order.total_amount)) > 0.01) {
        // If there's a discrepancy, log it and use the database total
        console.log(`Total amount discrepancy for order ${order.id}: calculated ${calculatedTotal}, stored ${order.total_amount}`);
      }
      
      // Create customer_info object from available fields
      order.customer_info = {
        fullName: order.customer_name || 'N/A',
        email: order.customer_email || 'N/A', 
        phone: order.customer_phone || 'N/A'
      };
      
      // Remove individual customer fields to avoid duplication
      delete order.customer_name;
      delete order.customer_email;
      delete order.customer_phone;
      
      // Create payment_details object
      order.payment_details = {
        method: order.payment_method || 'N/A'
      };
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
