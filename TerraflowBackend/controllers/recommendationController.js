const { pool } = require('../config/database');

// Smart Production Recommendation Controller
const getProductionRecommendations = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get last 30 days order data
    const [orderData] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.stock_quantity,
        p.minimum_stock,
        p.reorder_point,
        SUM(oi.quantity) as total_ordered,
        COUNT(DISTINCT o.id) as order_count,
        AVG(oi.quantity) as avg_order_quantity,
        p.production_time_days,
        (p.stock_quantity - COALESCE(SUM(oi.quantity), 0)) as projected_stock
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id 
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      WHERE p.category = 'finished_products' 
        AND p.is_active = true
      GROUP BY p.id, p.name, p.category, p.stock_quantity, p.minimum_stock, p.reorder_point, p.production_time_days
      ORDER BY total_ordered DESC, projected_stock ASC
    `);

    // Calculate recommendations
    const recommendations = orderData.map(product => {
      const demandScore = (product.total_ordered || 0) / 30; // Daily demand
      const stockDays = product.stock_quantity / Math.max(demandScore, 1); // Days of stock remaining
      const urgency = stockDays <= 7 ? 'high' : stockDays <= 14 ? 'medium' : 'low';
      
      // Calculate recommended production quantity
      let recommendedQuantity = 0;
      if (product.stock_quantity <= product.minimum_stock) {
        recommendedQuantity = Math.max(
          product.reorder_point || product.minimum_stock * 2,
          Math.ceil(demandScore * 30) // 30 days worth of demand
        );
      } else if (urgency === 'medium') {
        recommendedQuantity = Math.ceil(demandScore * 14); // 14 days worth
      }

      return {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        current_stock: product.stock_quantity,
        minimum_stock: product.minimum_stock,
        total_ordered_30days: product.total_ordered || 0,
        daily_demand: parseFloat(demandScore.toFixed(2)),
        stock_days_remaining: Math.floor(stockDays),
        urgency_level: urgency,
        recommended_quantity: recommendedQuantity,
        production_time_days: product.production_time_days || 7,
        priority_score: calculatePriorityScore(product, demandScore, stockDays)
      };
    });

    // Filter and sort recommendations
    const criticalRecommendations = recommendations
      .filter(r => r.recommended_quantity > 0)
      .sort((a, b) => b.priority_score - a.priority_score);

    // Get raw materials analysis
    const [rawMaterials] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.stock_quantity,
        p.minimum_stock,
        CASE 
          WHEN p.stock_quantity <= p.minimum_stock THEN 'critical'
          WHEN p.stock_quantity <= p.minimum_stock * 1.5 THEN 'low'
          ELSE 'sufficient'
        END as stock_status
      FROM products p
      WHERE p.category = 'raw_materials' AND p.is_active = true
      ORDER BY 
        CASE 
          WHEN p.stock_quantity <= p.minimum_stock THEN 1
          WHEN p.stock_quantity <= p.minimum_stock * 1.5 THEN 2
          ELSE 3
        END,
        p.stock_quantity ASC
    `);

    connection.release();

    res.json({
      success: true,
      data: {
        production_recommendations: criticalRecommendations.slice(0, 10), // Top 10
        raw_materials_status: rawMaterials,
        analysis_period: '30 days',
        generated_at: new Date().toISOString(),
        summary: {
          total_products_analyzed: orderData.length,
          critical_recommendations: criticalRecommendations.filter(r => r.urgency_level === 'high').length,
          medium_priority: criticalRecommendations.filter(r => r.urgency_level === 'medium').length,
          raw_materials_critical: rawMaterials.filter(rm => rm.stock_status === 'critical').length
        }
      }
    });

  } catch (error) {
    console.error('Production recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating production recommendations',
      error: error.message
    });
  }
};

// Calculate priority score for production recommendations
const calculatePriorityScore = (product, demandScore, stockDays) => {
  let score = 0;
  
  // Demand factor (higher demand = higher priority)
  score += demandScore * 10;
  
  // Stock urgency factor (lower stock days = higher priority)
  if (stockDays <= 3) score += 50;
  else if (stockDays <= 7) score += 30;
  else if (stockDays <= 14) score += 15;
  
  // Below minimum stock penalty
  if (product.stock_quantity <= product.minimum_stock) score += 25;
  
  // High order frequency bonus
  if (product.order_count >= 10) score += 10;
  
  return parseFloat(score.toFixed(2));
};

// Get demand forecast for next 30 days
const getDemandForecast = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [forecastData] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.stock_quantity,
        AVG(daily_orders.daily_quantity) as avg_daily_demand,
        STDDEV(daily_orders.daily_quantity) as demand_variance,
        COUNT(daily_orders.order_date) as active_days
      FROM products p
      LEFT JOIN (
        SELECT 
          oi.product_id,
          DATE(o.created_at) as order_date,
          SUM(oi.quantity) as daily_quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
          AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
        GROUP BY oi.product_id, DATE(o.created_at)
      ) daily_orders ON p.id = daily_orders.product_id
      WHERE p.category = 'finished_products' AND p.is_active = true
      GROUP BY p.id, p.name, p.category, p.stock_quantity
      HAVING avg_daily_demand > 0
      ORDER BY avg_daily_demand DESC
    `);

    const forecast = forecastData.map(product => {
      const avgDemand = product.avg_daily_demand || 0;
      const variance = product.demand_variance || 0;
      const forecastNext30 = avgDemand * 30;
      const safetyStock = Math.ceil(avgDemand * 7); // 7 days safety stock
      
      return {
        product_id: product.id,
        product_name: product.name,
        current_stock: product.stock_quantity,
        avg_daily_demand: parseFloat(avgDemand.toFixed(2)),
        forecast_30_days: Math.ceil(forecastNext30),
        recommended_safety_stock: safetyStock,
        stockout_risk: product.stock_quantity < forecastNext30 ? 'high' : 'low',
        demand_stability: variance < avgDemand * 0.5 ? 'stable' : 'volatile'
      };
    });

    connection.release();

    res.json({
      success: true,
      data: {
        demand_forecast: forecast,
        forecast_period: '30 days',
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Demand forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating demand forecast',
      error: error.message
    });
  }
};

module.exports = {
  getProductionRecommendations,
  getDemandForecast
};
