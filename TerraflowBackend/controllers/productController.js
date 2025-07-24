const { pool } = require('../config/database');
const { validationResult } = require('express-validator');
const { triggerLowStockAlert } = require('./notificationController');

/**
 * Product Controller
 * Handles all product-related operations including inventory management
 */

// Get all products with filtering
const getProducts = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 20, 
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      minPrice,
      maxPrice,
      inStock = false 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Add filters
    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    if (inStock === 'true') {
      whereClause += ' AND p.stock_quantity > 0';
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM products p 
      ${whereClause}
    `, params);

    // Get products with their images
    const [products] = await pool.execute(`
      SELECT 
        p.*,
        (CASE 
          WHEN p.stock_quantity <= p.minimum_stock THEN 'low'
          WHEN p.stock_quantity <= p.minimum_stock * 2 THEN 'medium'
          ELSE 'good'
        END) as stock_status
      FROM products p 
      ${whereClause}
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get images for all products
    const productIds = products.map(p => p.id);
    let productImages = [];
    
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const [images] = await pool.execute(`
        SELECT product_id, image_url, image_alt, display_order, is_primary
        FROM product_images 
        WHERE product_id IN (${placeholders})
        ORDER BY product_id, display_order
      `, productIds);
      productImages = images;
    }

    // Group images by product_id and attach to products
    const productsWithImages = products.map(product => {
      const productImageList = productImages.filter(img => img.product_id === product.id);
      
      // If no images from product_images table, check gallery_images column
      let finalImages = productImageList;
      if (finalImages.length === 0 && product.gallery_images) {
        try {
          const galleryImages = JSON.parse(product.gallery_images);
          finalImages = galleryImages.map((imgUrl, index) => ({
            image_url: imgUrl,
            image_alt: product.name,
            display_order: index + 1,
            is_primary: index === 0
          }));
        } catch (e) {
          console.error('Error parsing gallery_images for product', product.id, e);
        }
      }
      
      // Fallback to default image if still no images
      if (finalImages.length === 0) {
        finalImages = [{
          image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          image_alt: product.name,
          display_order: 1,
          is_primary: true
        }];
      }
      
      return {
        ...product,
        images: finalImages,
        primary_image: finalImages.find(img => img.is_primary)?.image_url || 
                      finalImages[0]?.image_url || 
                      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
      };
    });

    const totalPages = Math.ceil(countResult[0].total / parseInt(limit));

    res.json({
      success: true,
      data: {
        products: productsWithImages,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: countResult[0].total,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const [product] = await pool.execute(`
      SELECT 
        p.*,
        (CASE 
          WHEN p.stock_quantity <= p.minimum_stock THEN 'low'
          WHEN p.stock_quantity <= p.minimum_stock * 2 THEN 'medium'
          ELSE 'good'
        END) as stock_status
      FROM products p 
      WHERE p.id = ? AND p.is_active = true
    `, [productId]);

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get images from product_images table
    const [images] = await pool.execute(`
      SELECT image_url, image_alt, display_order, is_primary
      FROM product_images 
      WHERE product_id = ?
      ORDER BY display_order
    `, [productId]);

    let finalImages = images;
    
    // If no images from product_images table, check gallery_images column
    if (finalImages.length === 0 && product[0].gallery_images) {
      try {
        const galleryImages = JSON.parse(product[0].gallery_images);
        finalImages = galleryImages.map((imgUrl, index) => ({
          image_url: imgUrl,
          image_alt: product[0].name,
          display_order: index + 1,
          is_primary: index === 0
        }));
      } catch (e) {
        console.error('Error parsing gallery_images for product', productId, e);
      }
    }
    
    // Fallback to default image if still no images
    if (finalImages.length === 0) {
      finalImages = [{
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        image_alt: product[0].name,
        display_order: 1,
        is_primary: true
      }];
    }

    const productWithImages = {
      ...product[0],
      images: finalImages,
      primary_image: finalImages.find(img => img.is_primary)?.image_url || 
                    finalImages[0]?.image_url || 
                    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
    };

    res.json({
      success: true,
      data: productWithImages
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// Create new product (Admin only)
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      category,
      price,
      stock_quantity,
      minimum_stock = 10,
      unit = 'pieces',
      sku,
      image_url,
      firing_temperature,
      clay_type,
      glaze_type,
      dimensions,
      weight_kg,
      production_time_days,
      is_custom_order = false
    } = req.body;

    // Check if SKU already exists
    if (sku) {
      const [existingSku] = await pool.execute(
        'SELECT id FROM products WHERE sku = ?',
        [sku]
      );

      if (existingSku.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    const [result] = await pool.execute(`
      INSERT INTO products (
        name, description, category, price, stock_quantity, minimum_stock,
        unit, sku, image_url, firing_temperature, clay_type, glaze_type,
        dimensions, weight_kg, production_time_days, is_custom_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description, category, price, stock_quantity, minimum_stock,
      unit, sku, image_url, firing_temperature, clay_type, glaze_type,
      dimensions, weight_kg, production_time_days, is_custom_order
    ]);

    // Log inventory movement
    await pool.execute(`
      INSERT INTO inventory_movements (
        product_id, movement_type, quantity, reference_type, notes, created_by
      ) VALUES (?, 'in', ?, 'adjustment', 'Initial stock', ?)
    `, [result.insertId, stock_quantity, req.user.id]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    // Check if product exists
    const [existingProduct] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check SKU uniqueness if updating SKU
    if (updateData.sku && updateData.sku !== existingProduct[0].sku) {
      const [existingSku] = await pool.execute(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [updateData.sku, productId]
      );

      if (existingSku.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(productId);

    await pool.execute(`
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, updateValues);

    // Log stock changes if stock_quantity was updated
    if (updateData.stock_quantity !== undefined) {
      const stockDifference = updateData.stock_quantity - existingProduct[0].stock_quantity;
      if (stockDifference !== 0) {
        await pool.execute(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, reference_type, notes, created_by
          ) VALUES (?, ?, ?, 'adjustment', 'Stock adjustment via product update', ?)
        `, [
          productId,
          stockDifference > 0 ? 'in' : 'out',
          Math.abs(stockDifference),
          req.user.id
        ]);
      }

      // Check for low stock and trigger alert
      const minimumStock = updateData.minimum_stock || existingProduct[0].minimum_stock;
      if (updateData.stock_quantity <= minimumStock) {
        await triggerLowStockAlert(productId, updateData.stock_quantity, minimumStock);
      }
    }

    res.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists and is not referenced in orders
    const [productCheck] = await pool.execute(`
      SELECT p.id, COUNT(oi.id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [productId]);

    if (productCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (productCheck[0].order_count > 0) {
      // Soft delete - just deactivate
      await pool.execute(
        'UPDATE products SET is_active = false WHERE id = ?',
        [productId]
      );
    } else {
      // Hard delete if no orders reference it
      await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    }

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

// Get inventory movements for a product
const getProductInventoryHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [movements] = await pool.execute(`
      SELECT 
        im.*,
        u.full_name as created_by_name
      FROM inventory_movements im
      LEFT JOIN users u ON im.created_by = u.id
      WHERE im.product_id = ?
      ORDER BY im.created_at DESC
      LIMIT ? OFFSET ?
    `, [productId, parseInt(limit), offset]);

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM inventory_movements WHERE product_id = ?',
      [productId]
    );

    res.json({
      success: true,
      data: {
        movements,
        pagination: {
          current_page: parseInt(page),
          total_items: countResult[0].total,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get product inventory history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory history'
    });
  }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT 
        id, name, category, stock_quantity, minimum_stock, price, unit
      FROM products 
      WHERE stock_quantity <= minimum_stock 
        AND is_active = true
      ORDER BY (stock_quantity / minimum_stock) ASC
    `);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products'
    });
  }
};

// Get product categories
const getProductCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT 
        category,
        COUNT(*) as product_count,
        AVG(price) as avg_price
      FROM products 
      WHERE is_active = true
      GROUP BY category
      ORDER BY product_count DESC
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get product categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product categories'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductInventoryHistory,
  getLowStockProducts,
  getProductCategories
};
