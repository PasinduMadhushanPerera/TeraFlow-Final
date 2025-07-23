const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductInventoryHistory,
  getLowStockProducts,
  getProductCategories
} = require('../controllers/productController');

const router = express.Router();

// Product validation middleware
const productValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('category')
    .isIn(['raw_materials', 'finished_products', 'tools', 'packaging', 'chemicals'])
    .withMessage('Invalid product category'),
  
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  
  body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  body('minimum_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  
  body('unit')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Unit must not exceed 50 characters'),
  
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU must not exceed 100 characters')
];

// Public routes
router.get('/', getProducts);
router.get('/categories', getProductCategories);
router.get('/low-stock', authenticateToken, authorizeRole(['admin']), getLowStockProducts);
router.get('/:productId', getProductById);

// Admin-only routes
router.post('/', authenticateToken, authorizeRole(['admin']), productValidation, createProduct);
router.put('/:productId', authenticateToken, authorizeRole(['admin']), updateProduct);
router.delete('/:productId', authenticateToken, authorizeRole(['admin']), deleteProduct);
router.get('/:productId/inventory-history', authenticateToken, authorizeRole(['admin']), getProductInventoryHistory);

module.exports = router;
