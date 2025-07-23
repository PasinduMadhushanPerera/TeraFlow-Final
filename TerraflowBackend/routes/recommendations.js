const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getProductionRecommendations,
  getDemandForecast
} = require('../controllers/recommendationController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Smart production recommendations
router.get('/production', getProductionRecommendations);

// Demand forecast
router.get('/forecast', getDemandForecast);

module.exports = router;
