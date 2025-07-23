const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// All cart routes require customer authentication
router.use(authenticateToken);
router.use(authorizeRole(['customer']));

// Cart management routes
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:id', updateCartItem);
router.delete('/item/:id', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
