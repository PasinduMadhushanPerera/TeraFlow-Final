const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const [users] = await pool.execute(
      'SELECT id, role, full_name, email, is_active FROM users WHERE id = ? AND is_active = true',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check if user has required role
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorizeRole(['admin']);

// Customer only middleware
const customerOnly = authorizeRole(['customer']);

// Supplier only middleware
const supplierOnly = authorizeRole(['supplier']);

// Customer or Admin middleware
const customerOrAdmin = authorizeRole(['customer', 'admin']);

// Supplier or Admin middleware
const supplierOrAdmin = authorizeRole(['supplier', 'admin']);

module.exports = {
  authenticateToken,
  authorizeRole,
  adminOnly,
  customerOnly,
  supplierOnly,
  customerOrAdmin,
  supplierOrAdmin
};
