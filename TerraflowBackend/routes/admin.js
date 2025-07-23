const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Import upload middleware
const { uploadMixed, handleUploadError } = require('../middleware/upload');

const {
  getAllUsers,
  getDashboardStats,
  updateUserStatus,
  deleteUser,
  createUser,
  updateUser,
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
  getInventoryMovements,
  createInventoryAdjustment,
  getLowStockAlerts,
  getAnalytics,
  bulkUpdateProductPrices,
  getSystemNotifications,
  exportData
} = require('../controllers/adminController');

const { authenticateToken, adminOnly } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateToken, adminOnly);

// User management routes
router.get('/users', getAllUsers);
router.post('/users', [
  body('full_name').trim().isLength({ min: 2, max: 255 }).withMessage('Full name must be 2-255 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobile').trim().isLength({ min: 10, max: 15 }).withMessage('Mobile must be 10-15 characters'),
  body('role').isIn(['customer', 'supplier']).withMessage('Invalid role'),
  body('address').trim().isLength({ min: 5, max: 500 }).withMessage('Address must be 5-500 characters')
], createUser);
router.put('/users/:userId', [
  body('full_name').trim().isLength({ min: 2, max: 255 }).withMessage('Full name must be 2-255 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('mobile').trim().isLength({ min: 10, max: 15 }).withMessage('Mobile must be 10-15 characters'),
  body('role').isIn(['customer', 'supplier']).withMessage('Invalid role'),
  body('address').trim().isLength({ min: 5, max: 500 }).withMessage('Address must be 5-500 characters')
], updateUser);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Product management routes
router.get('/products', getAllProducts);
router.post('/products', 
  uploadMixed,
  handleUploadError,
  [
    body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Product name must be 2-255 characters'),
    body('category').isIn(['raw_materials', 'finished_products', 'tools', 'packaging', 'chemicals']).withMessage('Invalid category'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer'),
    body('minimum_stock').isInt({ min: 0 }).withMessage('Minimum stock must be a positive integer'),
    body('unit').optional().trim().isLength({ max: 50 }).withMessage('Unit must not exceed 50 characters'),
    body('sku').optional().trim().isLength({ max: 100 }).withMessage('SKU must not exceed 100 characters')
  ], 
  createProduct
);
router.put('/products/:productId', 
  uploadMixed,
  handleUploadError,
  updateProduct
);
router.delete('/products/:productId', deleteProduct);

// Order management routes
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderDetails);
router.put('/orders/:orderId/status', [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], updateOrderStatus);

// Supplier management routes
router.get('/suppliers', getAllSuppliers);
router.get('/material-requests', getAllMaterialRequests);
router.post('/material-requests', [
  body('supplier_id').isInt().withMessage('Supplier ID must be an integer'),
  body('material_type').trim().isLength({ min: 2, max: 255 }).withMessage('Material type must be 2-255 characters'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unit').trim().isLength({ min: 1, max: 50 }).withMessage('Unit must be 1-50 characters'),
  body('required_date').isISO8601().withMessage('Required date must be a valid date'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters')
], createMaterialRequest);
router.put('/material-requests/:requestId/status', [
  body('status').isIn(['pending', 'approved', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('admin_notes').optional().trim().isLength({ max: 1000 }).withMessage('Admin notes must not exceed 1000 characters')
], updateMaterialRequestStatus);

// Reports routes
router.get('/reports/sales', (req, res, next) => {
  req.query.type = 'sales';
  next();
}, getReportsData);
router.get('/reports/inventory', (req, res, next) => {
  req.query.type = 'inventory';
  next();
}, getReportsData);
router.get('/reports/suppliers', (req, res, next) => {
  req.query.type = 'suppliers';
  next();
}, getReportsData);

// Inventory management routes
router.get('/inventory/movements', getInventoryMovements);
router.post('/inventory/adjustment', [
  body('product_id').isInt().withMessage('Product ID must be an integer'),
  body('adjustment_type').isIn(['increase', 'decrease']).withMessage('Invalid adjustment type'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
], createInventoryAdjustment);
router.get('/inventory/alerts', getLowStockAlerts);

// Analytics routes
router.get('/analytics', getAnalytics);

// Bulk update routes
router.post('/products/bulk-price-update', [
  body('ids').isArray().withMessage('IDs must be an array'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], bulkUpdateProductPrices);

// Notification routes
router.get('/notifications/system', getSystemNotifications);

// Data export routes
router.get('/data/export', exportData);

module.exports = router;
