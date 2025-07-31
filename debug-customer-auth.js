const axios = require('axios');

async function debugCustomerAuth() {
  try {
    console.log('🔧 Debugging Customer Authentication...');
    
    // Login as customer to get fresh token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testcustomer@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.token;
    
    // Test authentication by checking dashboard
    console.log('\n🏠 Testing dashboard endpoint...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/customer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Dashboard response:', JSON.stringify(dashboardResponse.data, null, 2));
    } catch (dashboardError) {
      console.error('❌ Dashboard error:', dashboardError.response ? dashboardError.response.data : dashboardError.message);
    }
    
    // Test products endpoint
    console.log('\n📦 Testing products endpoint...');
    try {
      const productsResponse = await axios.get('http://localhost:5000/api/customer/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Products response success - items count:', productsResponse.data.data.length);
      console.log('First product:', JSON.stringify(productsResponse.data.data[0], null, 2));
    } catch (productsError) {
      console.error('❌ Products error:', productsError.response ? productsError.response.data : productsError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.response ? error.response.data : error.message);
  }
}

debugCustomerAuth();
