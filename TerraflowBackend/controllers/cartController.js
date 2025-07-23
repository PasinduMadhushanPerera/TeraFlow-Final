const { pool } = require('../config/database');

/**
 * Cart Controller for managing shopping cart operations
 */

// Get customer's cart items
const getCart = async (req, res) => {
  try {
    const customerId = req.user.id;

    const [cartItems] = await pool.execute(`
      SELECT 
        c.id,
        c.quantity,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock_quantity,
        p.unit,
        (c.quantity * p.price) as subtotal
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = ? AND p.is_active = true
      ORDER BY c.created_at DESC
    `, [customerId]);

    const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        total_amount: totalAmount.toFixed(2),
        item_count: cartItems.length
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart items'
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    // Validate product exists and is active
    const [product] = await pool.execute(
      'SELECT id, stock_quantity, price FROM products WHERE id = ? AND is_active = true',
      [product_id]
    );

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if enough stock is available
    if (product[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Check if item already exists in cart
    const [existingItem] = await pool.execute(
      'SELECT id, quantity FROM cart WHERE customer_id = ? AND product_id = ?',
      [customerId, product_id]
    );

    if (existingItem.length > 0) {
      // Update existing cart item
      const newQuantity = existingItem[0].quantity + quantity;
      
      if (product[0].stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for requested quantity'
        });
      }

      await pool.execute(
        'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingItem[0].id]
      );
    } else {
      // Add new cart item
      await pool.execute(
        'INSERT INTO cart (customer_id, product_id, quantity) VALUES (?, ?, ?)',
        [customerId, product_id, quantity]
      );
    }

    res.json({
      success: true,
      message: 'Item added to cart successfully'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Check if cart item belongs to customer and get product info
    const [cartItem] = await pool.execute(`
      SELECT c.id, c.product_id, p.stock_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ? AND c.customer_id = ?
    `, [id, customerId]);

    if (cartItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check stock availability
    if (cartItem[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    await pool.execute(
      'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );

    res.json({
      success: true,
      message: 'Cart item updated successfully'
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM cart WHERE id = ? AND customer_id = ?',
      [id, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const customerId = req.user.id;

    await pool.execute('DELETE FROM cart WHERE customer_id = ?', [customerId]);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
