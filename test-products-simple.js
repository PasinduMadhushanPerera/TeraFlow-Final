const axios = require('axios');

async function testProductsAPI() {
  try {
    console.log('🧪 Testing Products API...');
    
    // Login with existing customer
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testcustomer@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login response:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Test customer products API
    console.log('\n📦 Testing customer products API...');
    const productsResponse = await axios.get('http://localhost:5000/api/customer/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Products API successful!');
    console.log('📊 Response:', JSON.stringify(productsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testProductsAPI();
