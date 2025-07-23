const { pool } = require('../config/database');

/**
 * Advanced Production Recommendations Controller
 * AI-powered system for analyzing sales data and suggesting optimal production
 */

// Enhanced AI-powered production recommendations
const generateAdvancedRecommendations = async (req, res) => {
  try {
    const { period_days = 30, include_seasonal = true, min_confidence = 0.7 } = req.query;

    // Get comprehensive sales data with seasonal analysis
    const [salesData] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.cost_price,
        p.stock_quantity,
        p.minimum_stock,
        p.maximum_stock,
        p.reorder_point,
        p.reorder_quantity,
        p.production_time_days,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        AVG(oi.quantity) as avg_order_quantity,
        SUM(oi.subtotal) as total_revenue,
        MAX(o.created_at) as last_order_date,
        
        -- Seasonal analysis (last 90 days for comparison)
        COALESCE(SUM(CASE 
          WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) 
          THEN oi.quantity ELSE 0 
        END), 0) as sales_90_days,
        
        -- Weekly breakdown for trend analysis
        COALESCE(SUM(CASE 
          WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
          THEN oi.quantity ELSE 0 
        END), 0) as sales_7_days,
        
        COALESCE(SUM(CASE 
          WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
            AND o.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
          THEN oi.quantity ELSE 0 
        END), 0) as sales_previous_week
        
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('cancelled', 'rejected')
      WHERE p.category = 'finished_products'
        AND p.is_active = true
        AND (o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) OR o.created_at IS NULL)
      GROUP BY p.id, p.name, p.category, p.price, p.cost_price, p.stock_quantity, 
               p.minimum_stock, p.maximum_stock, p.reorder_point, p.reorder_quantity, p.production_time_days
      ORDER BY total_sold DESC, total_revenue DESC
    `, [period_days]);

    // Generate intelligent recommendations with AI-like scoring
    const recommendations = salesData.map(product => {
      const dailyAverage = (product.total_sold || 0) / period_days;
      const weeklyDemand = dailyAverage * 7;
      const monthlyDemand = dailyAverage * 30;
      
      // Calculate velocity and trends
      const salesVelocity = product.sales_7_days / 7;
      const trendFactor = product.sales_previous_week > 0 
        ? product.sales_7_days / product.sales_previous_week 
        : 1;
      
      // Stock runway calculation
      const stockRunwayDays = salesVelocity > 0 ? product.stock_quantity / salesVelocity : 999;
      
      // Seasonal factor
      const seasonalFactor = include_seasonal && product.sales_90_days > 0
        ? (product.total_sold / period_days) / (product.sales_90_days / 90)
        : 1;
      
      // Profit analysis
      const unitProfit = product.cost_price 
        ? product.price - product.cost_price 
        : product.price * 0.4; // 40% default margin
      
      const profitMargin = product.price > 0 
        ? (unitProfit / product.price) * 100 
        : 0;
      
      // AI Confidence Score (0-1)
      let confidence = 0.5; // Base confidence
      
      // Increase confidence based on sales data quality
      if (product.order_count >= 5) confidence += 0.2;
      if (product.unique_customers >= 3) confidence += 0.15;
      if (product.total_sold >= 10) confidence += 0.15;
      
      // Adjust for trend
      if (trendFactor > 1.2) confidence += 0.1; // Growing trend
      if (trendFactor < 0.8) confidence -= 0.1; // Declining trend
      
      // Determine priority and recommendations
      let priority = 'low';
      let recommendedQuantity = 0;
      let reason = 'Sufficient stock available';
      let urgencyScore = 0;
      
      // Critical stock levels
      if (product.stock_quantity <= product.minimum_stock) {
        priority = 'urgent';
        urgencyScore = 100;
        recommendedQuantity = Math.max(
          product.reorder_quantity || Math.ceil(monthlyDemand * seasonalFactor),
          Math.ceil(weeklyDemand * 4 * seasonalFactor)
        );
        reason = 'Stock below minimum threshold - immediate action required';
        confidence = Math.min(confidence + 0.2, 1.0);
      }
      // Stock will run out soon
      else if (stockRunwayDays <= 7) {
        priority = 'high';
        urgencyScore = 80;
        recommendedQuantity = Math.ceil(monthlyDemand * seasonalFactor * trendFactor);
        reason = `Stock will run out in ${Math.round(stockRunwayDays)} days`;
      }
      // Medium priority - proactive restocking
      else if (stockRunwayDays <= 14 || product.stock_quantity <= product.reorder_point) {
        priority = 'medium';
        urgencyScore = 60;
        recommendedQuantity = Math.ceil(weeklyDemand * 3 * seasonalFactor);
        reason = 'Proactive restocking recommended';
      }
      // Low priority but trending up
      else if (trendFactor > 1.5 && product.total_sold > 0) {
        priority = 'medium';
        urgencyScore = 40;
        recommendedQuantity = Math.ceil(weeklyDemand * 2 * trendFactor);
        reason = 'High growth trend detected - consider increasing production';
      }
      
      // Calculate potential revenue and ROI
      const potentialRevenue = recommendedQuantity * product.price;
      const productionCost = recommendedQuantity * (product.cost_price || product.price * 0.6);
      const potentialProfit = potentialRevenue - productionCost;
      const roi = productionCost > 0 ? (potentialProfit / productionCost) * 100 : 0;
      
      return {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        current_stock: product.stock_quantity,
        minimum_stock: product.minimum_stock,
        reorder_point: product.reorder_point,
        
        // Sales analytics
        total_sold: product.total_sold || 0,
        daily_average: Math.round(dailyAverage * 100) / 100,
        weekly_demand: Math.ceil(weeklyDemand),
        monthly_demand: Math.ceil(monthlyDemand),
        sales_velocity: Math.round(salesVelocity * 100) / 100,
        trend_factor: Math.round(trendFactor * 100) / 100,
        seasonal_factor: Math.round(seasonalFactor * 100) / 100,
        
        // Recommendations
        priority,
        urgency_score: urgencyScore,
        recommended_quantity: recommendedQuantity,
        reason,
        confidence_score: Math.round(confidence * 100) / 100,
        
        // Financial analysis
        unit_price: product.price,
        unit_cost: product.cost_price,
        unit_profit: Math.round(unitProfit * 100) / 100,
        profit_margin: Math.round(profitMargin * 100) / 100,
        potential_revenue: Math.round(potentialRevenue * 100) / 100,
        potential_profit: Math.round(potentialProfit * 100) / 100,
        roi_percentage: Math.round(roi * 100) / 100,
        
        // Timing
        stock_runway_days: Math.round(stockRunwayDays),
        production_time_days: product.production_time_days || 7,
        last_order_date: product.last_order_date,
        order_frequency: product.order_count || 0,
        customer_demand: product.unique_customers || 0
      };
    });

    // Filter by confidence threshold and sort intelligently
    const filteredRecommendations = recommendations
      .filter(rec => rec.confidence_score >= parseFloat(min_confidence))
      .sort((a, b) => {
        // Primary sort: urgency score
        if (a.urgency_score !== b.urgency_score) {
          return b.urgency_score - a.urgency_score;
        }
        // Secondary sort: ROI
        if (Math.abs(a.roi_percentage - b.roi_percentage) > 5) {
          return b.roi_percentage - a.roi_percentage;
        }
        // Tertiary sort: potential profit
        return b.potential_profit - a.potential_profit;
      });

    // Generate summary analytics
    const summary = {
      total_products_analyzed: salesData.length,
      recommendations_generated: filteredRecommendations.length,
      urgent_actions_needed: filteredRecommendations.filter(r => r.priority === 'urgent').length,
      high_priority_items: filteredRecommendations.filter(r => r.priority === 'high').length,
      total_recommended_investment: filteredRecommendations.reduce((sum, r) => 
        sum + (r.recommended_quantity * (r.unit_cost || r.unit_price * 0.6)), 0
      ),
      projected_revenue: filteredRecommendations.reduce((sum, r) => sum + r.potential_revenue, 0),
      projected_profit: filteredRecommendations.reduce((sum, r) => sum + r.potential_profit, 0),
      average_confidence: filteredRecommendations.length > 0 
        ? filteredRecommendations.reduce((sum, r) => sum + r.confidence_score, 0) / filteredRecommendations.length
        : 0
    };

    res.json({
      success: true,
      data: {
        recommendations: filteredRecommendations,
        summary: {
          ...summary,
          total_recommended_investment: Math.round(summary.total_recommended_investment * 100) / 100,
          projected_revenue: Math.round(summary.projected_revenue * 100) / 100,
          projected_profit: Math.round(summary.projected_profit * 100) / 100,
          average_confidence: Math.round(summary.average_confidence * 100) / 100,
          analysis_period_days: parseInt(period_days),
          generated_at: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Generate advanced recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate production recommendations'
    });
  }
};

// Save production recommendations to database
const saveRecommendations = async (req, res) => {
  try {
    const { recommendations } = req.body;

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendations data'
      });
    }

    // Clear existing recommendations
    await pool.execute('DELETE FROM production_recommendations WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)');

    // Insert new recommendations
    for (const rec of recommendations) {
      if (rec.recommended_quantity > 0) {
        await pool.execute(`
          INSERT INTO production_recommendations 
          (product_id, recommended_quantity, priority, reason, based_on_period_days, 
           demand_forecast, current_stock, recommended_stock, profit_margin)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          rec.product_id,
          rec.recommended_quantity,
          rec.priority,
          rec.reason,
          30, // based_on_period_days
          rec.monthly_demand,
          rec.current_stock,
          rec.current_stock + rec.recommended_quantity,
          rec.profit_margin
        ]);
      }
    }

    res.json({
      success: true,
      message: 'Production recommendations saved successfully'
    });

  } catch (error) {
    console.error('Save recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save production recommendations'
    });
  }
};

// Get saved production recommendations
const getRecommendations = async (req, res) => {
  try {
    const [recommendations] = await pool.execute(`
      SELECT 
        pr.*,
        p.name as product_name,
        p.category,
        p.price,
        p.stock_quantity as current_stock_quantity
      FROM production_recommendations pr
      JOIN products p ON pr.product_id = p.id
      WHERE pr.is_implemented = false
      ORDER BY 
        FIELD(pr.priority, 'urgent', 'high', 'medium', 'low'),
        pr.profit_margin DESC,
        pr.created_at DESC
    `);

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production recommendations'
    });
  }
};

// Mark recommendation as implemented
const markImplemented = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'UPDATE production_recommendations SET is_implemented = true, implemented_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      message: 'Recommendation marked as implemented'
    });

  } catch (error) {
    console.error('Mark implemented error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recommendation'
    });
  }
};

// Get production analytics dashboard data
const getAnalytics = async (req, res) => {
  try {
    // Get current month's production recommendations summary
    const [monthlyStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_recommendations,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_count,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_count,
        SUM(recommended_quantity) as total_recommended_units,
        AVG(profit_margin) as avg_profit_margin
      FROM production_recommendations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Get top selling products last 30 days
    const [topProducts] = await pool.execute(`
      SELECT 
        p.name,
        p.category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.status NOT IN ('cancelled')
      GROUP BY p.id, p.name, p.category
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    // Get low stock alerts
    const [lowStock] = await pool.execute(`
      SELECT 
        id,
        name,
        stock_quantity,
        minimum_stock,
        category
      FROM products 
      WHERE stock_quantity <= minimum_stock 
        AND is_active = true
        AND category = 'finished_products'
      ORDER BY (stock_quantity / minimum_stock) ASC
    `);

    res.json({
      success: true,
      data: {
        monthly_stats: monthlyStats[0],
        top_products: topProducts,
        low_stock_alerts: lowStock,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

module.exports = {
  generateAdvancedRecommendations,
  saveRecommendations,
  getRecommendations,
  markImplemented,
  getAnalytics
};
