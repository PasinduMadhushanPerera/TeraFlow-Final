const { pool } = require('../config/database');

// Get supplier dashboard data
const getDashboardData = async (req, res) => {
  try {
    const supplierId = req.user.id;

    // Get material request statistics
    const [requestStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_requests
      FROM material_requests 
      WHERE supplier_id = ?
    `, [supplierId]);

    // Get recent material requests
    const [recentRequests] = await pool.execute(`
      SELECT 
        id, material_type, quantity, unit, status, 
        required_date, created_at
      FROM material_requests 
      WHERE supplier_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [supplierId]);

    // Get performance metrics
    const [performance] = await pool.execute(`
      SELECT 
        total_requests, completed_requests, avg_delivery_days, rating
      FROM supplier_performance 
      WHERE supplier_id = ?
    `, [supplierId]);

    res.json({
      success: true,
      data: {
        stats: requestStats[0],
        recentRequests,
        performance: performance[0] || {
          total_requests: 0,
          completed_requests: 0,
          avg_delivery_days: 0,
          rating: 0
        }
      }
    });

  } catch (error) {
    console.error('Get supplier dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// Get material requests for supplier
const getMaterialRequests = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        id, material_type, quantity, unit, required_date, 
        description, status, admin_notes, supplier_response,
        requested_date, completed_date, created_at, updated_at
      FROM material_requests 
      WHERE supplier_id = ?
    `;
    const params = [supplierId];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [requests] = await pool.execute(query, params);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Get material requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material requests'
    });
  }
};

// Update material request status
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, supplier_response } = req.body;
    const supplierId = req.user.id;

    // Verify request belongs to supplier
    const [request] = await pool.execute(
      'SELECT id, status as current_status FROM material_requests WHERE id = ? AND supplier_id = ?',
      [requestId, supplierId]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material request not found'
      });
    }

    // Update request
    const updateData = [status];
    let query = 'UPDATE material_requests SET status = ?';

    if (supplier_response) {
      query += ', supplier_response = ?';
      updateData.push(supplier_response);
    }

    if (status === 'completed') {
      query += ', completed_date = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = ?';
    updateData.push(requestId);

    await pool.execute(query, updateData);

    // Update supplier performance if completed
    if (status === 'completed') {
      await pool.execute(`
        UPDATE supplier_performance 
        SET completed_requests = completed_requests + 1
        WHERE supplier_id = ?
      `, [supplierId]);
    }

    res.json({
      success: true,
      message: 'Request status updated successfully'
    });

  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status'
    });
  }
};

// Get delivery history
const getDeliveryHistory = async (req, res) => {
  try {
    const supplierId = req.user.id;

    const [deliveries] = await pool.execute(`
      SELECT 
        id, material_type, quantity, unit, required_date,
        completed_date, admin_notes, supplier_response,
        DATEDIFF(completed_date, requested_date) as delivery_days
      FROM material_requests 
      WHERE supplier_id = ? AND status = 'completed'
      ORDER BY completed_date DESC
    `, [supplierId]);

    res.json({
      success: true,
      data: deliveries
    });

  } catch (error) {
    console.error('Get delivery history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery history'
    });
  }
};

// Get forecast data (placeholder for future implementation)
const getForecastData = async (req, res) => {
  try {
    const supplierId = req.user.id;

    // For now, return historical demand data
    const [demandData] = await pool.execute(`
      SELECT 
        material_type,
        COUNT(*) as request_count,
        SUM(quantity) as total_quantity,
        AVG(quantity) as avg_quantity,
        DATE_FORMAT(requested_date, '%Y-%m') as month
      FROM material_requests 
      WHERE supplier_id = ? 
        AND requested_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY material_type, DATE_FORMAT(requested_date, '%Y-%m')
      ORDER BY month DESC, request_count DESC
    `, [supplierId]);

    // Get top requested materials
    const [topMaterials] = await pool.execute(`
      SELECT 
        material_type,
        COUNT(*) as request_count,
        SUM(quantity) as total_quantity,
        AVG(quantity) as avg_quantity
      FROM material_requests 
      WHERE supplier_id = ? 
        AND requested_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY material_type
      ORDER BY request_count DESC
      LIMIT 10
    `, [supplierId]);

    res.json({
      success: true,
      data: {
        demandTrend: demandData,
        topMaterials,
        forecastNote: 'Forecast data is based on historical demand patterns. Advanced forecasting features will be available in future updates.'
      }
    });

  } catch (error) {
    console.error('Get forecast data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forecast data'
    });
  }
};

// Submit delivery confirmation
const confirmDelivery = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { delivery_notes, delivery_date } = req.body;
    const supplierId = req.user.id;

    // Verify request belongs to supplier and is in progress
    const [request] = await pool.execute(
      'SELECT id FROM material_requests WHERE id = ? AND supplier_id = ? AND status = ?',
      [requestId, supplierId, 'in_progress']
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or not in progress'
      });
    }

    // Update request to completed
    await pool.execute(`
      UPDATE material_requests 
      SET status = 'completed', 
          supplier_response = ?, 
          completed_date = ?
      WHERE id = ?
    `, [delivery_notes, delivery_date || new Date(), requestId]);

    // Update supplier performance
    await pool.execute(`
      UPDATE supplier_performance 
      SET completed_requests = completed_requests + 1
      WHERE supplier_id = ?
    `, [supplierId]);

    res.json({
      success: true,
      message: 'Delivery confirmed successfully'
    });

  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm delivery'
    });
  }
};

module.exports = {
  getDashboardData,
  getMaterialRequests,
  updateRequestStatus,
  getDeliveryHistory,
  getForecastData,
  confirmDelivery
};
