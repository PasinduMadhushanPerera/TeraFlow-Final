const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  generateAdvancedRecommendations,
  saveRecommendations,
  getRecommendations,
  markImplemented,
  getAnalytics
} = require('../controllers/productionController');

// All production routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Production recommendation routes
router.get('/recommendations/generate', generateAdvancedRecommendations);
router.post('/recommendations/save', saveRecommendations);
router.get('/recommendations', getRecommendations);
router.put('/recommendations/:id/implement', markImplemented);
router.get('/analytics', getAnalytics);

module.exports = router;
