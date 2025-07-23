const { pool } = require('../config/database');

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Generate unique SKU
const generateSKU = (category, name) => {
  const categoryCode = category.substring(0, 2).toUpperCase();
  const nameCode = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${categoryCode}${nameCode}${timestamp}`;
};

// Check product stock availability
const checkStockAvailability = async (productId, quantity) => {
  try {
    const [product] = await pool.execute(
      'SELECT stock_quantity, name FROM products WHERE id = ? AND is_active = true',
      [productId]
    );

    if (product.length === 0) {
      return { available: false, message: 'Product not found or inactive' };
    }

    if (product[0].stock_quantity < quantity) {
      return {
        available: false,
        message: `Insufficient stock for ${product[0].name}. Available: ${product[0].stock_quantity}`,
        availableStock: product[0].stock_quantity
      };
    }

    return { available: true, availableStock: product[0].stock_quantity };
  } catch (error) {
    throw new Error('Failed to check stock availability');
  }
};

// Calculate order total
const calculateOrderTotal = async (items) => {
  try {
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const [product] = await pool.execute(
        'SELECT id, name, price FROM products WHERE id = ? AND is_active = true',
        [item.product_id]
      );

      if (product.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      const subtotal = product[0].price * item.quantity;
      total += subtotal;

      orderItems.push({
        product_id: item.product_id,
        product_name: product[0].name,
        quantity: item.quantity,
        unit_price: product[0].price,
        subtotal
      });
    }

    return { total, items: orderItems };
  } catch (error) {
    throw error;
  }
};

// Format currency
const formatCurrency = (amount, currency = 'Rs.') => {
  // Custom formatting for Pakistani Rupees
  if (currency === 'Rs.') {
    return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date
const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Sanitize string for SQL LIKE queries
const sanitizeForLike = (str) => {
  return str.replace(/[%_\\]/g, '\\$&');
};

// Generate pagination metadata
const generatePaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

// Log activity
const logActivity = async (userId, action, details = null) => {
  try {
    await pool.execute(`
      INSERT INTO activity_logs (user_id, action, details, created_at)
      VALUES (?, ?, ?, NOW())
    `, [userId, action, details ? JSON.stringify(details) : null]);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error as logging failure shouldn't break the main operation
  }
};

// Calculate stock status
const getStockStatus = (currentStock, minimumStock) => {
  if (currentStock <= 0) return 'out_of_stock';
  if (currentStock <= minimumStock) return 'critical';
  if (currentStock <= minimumStock * 2) return 'low';
  return 'good';
};

// Generate report date range
const getReportDateRange = (period = '30d') => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

module.exports = {
  generateOrderNumber,
  generateSKU,
  checkStockAvailability,
  calculateOrderTotal,
  formatCurrency,
  formatDate,
  isValidEmail,
  isValidPhone,
  sanitizeForLike,
  generatePaginationMeta,
  logActivity,
  getStockStatus,
  getReportDateRange
};
