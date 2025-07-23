const axios = require('axios');

async function testSmartRecommendations() {
  try {
    console.log('🔍 Testing Smart Production Recommendation System...\n');

    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Admin login failed');
      return;
    }

    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin authenticated\n');

    // Test Production Recommendations
    console.log('1. Testing Production Recommendations...');
    try {
      const productionResponse = await axios.get('http://localhost:5000/api/recommendations/production', { headers });
      if (productionResponse.data.success) {
        console.log('✅ Production recommendations API working');
        const data = productionResponse.data.data;
        
        console.log(`   - Found ${data.production_recommendations.length} production recommendations`);
        console.log(`   - Critical recommendations: ${data.summary.critical_recommendations}`);
        console.log(`   - Medium priority: ${data.summary.medium_priority}`);
        console.log(`   - Raw materials critical: ${data.summary.raw_materials_critical}`);
        
        if (data.production_recommendations.length > 0) {
          const sample = data.production_recommendations[0];
          console.log('   - Sample recommendation:');
          console.log(`     * Product: ${sample.product_name}`);
          console.log(`     * Current Stock: ${sample.current_stock}`);
          console.log(`     * Recommended Quantity: ${sample.recommended_quantity}`);
          console.log(`     * Urgency: ${sample.urgency_level}`);
          console.log(`     * Priority Score: ${sample.priority_score}`);
        }
      } else {
        console.log('❌ Production recommendations failed:', productionResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Production recommendations error:', error.response?.data?.message || error.message);
    }

    // Test Demand Forecast
    console.log('\n2. Testing Demand Forecast...');
    try {
      const forecastResponse = await axios.get('http://localhost:5000/api/recommendations/forecast', { headers });
      if (forecastResponse.data.success) {
        console.log('✅ Demand forecast API working');
        const forecast = forecastResponse.data.data.demand_forecast;
        
        console.log(`   - Found ${forecast.length} demand forecasts`);
        
        if (forecast.length > 0) {
          const sample = forecast[0];
          console.log('   - Sample forecast:');
          console.log(`     * Product: ${sample.product_name}`);
          console.log(`     * Daily Demand: ${sample.avg_daily_demand}`);
          console.log(`     * 30-Day Forecast: ${sample.forecast_30_days}`);
          console.log(`     * Stockout Risk: ${sample.stockout_risk}`);
          console.log(`     * Demand Stability: ${sample.demand_stability}`);
        }
      } else {
        console.log('❌ Demand forecast failed:', forecastResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Demand forecast error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Smart Recommendation System Test Complete!');
    console.log('\n📋 Frontend Integration:');
    console.log('   - Visit Admin Dashboard → Forecast Panel');
    console.log('   - Smart Production Panel should display recommendations');
    console.log('   - Check urgency levels and priority scores');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testSmartRecommendations();
