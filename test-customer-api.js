const axios = require('axios');

async function testCustomerAPI() {
  try {
    console.log('🧪 Testing Customer API...');
    
    // First, let's register a test customer
    console.log('\n1. Registering test customer...');
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
      fullName: 'Test Customer',
      email: 'testcustomer@example.com',
      password: 'password123',
      role: 'customer',
      phone: '1234567890'
    });
    
    console.log('✅ Registration successful:', registerResponse.data);
    
    // Login with the customer
    console.log('\n2. Logging in as customer...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testcustomer@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Test customer products API
    console.log('\n3. Testing customer products API...');
    const productsResponse = await axios.get('http://localhost:5000/api/customer/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Products API successful!');
    console.log('📦 Number of products:', productsResponse.data.data.length);
    console.log('📋 First few products:', JSON.stringify(productsResponse.data.data.slice(0, 3), null, 2));
    
    // Test customer dashboard API
    console.log('\n4. Testing customer dashboard API...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/customer/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dashboard API successful!');
    console.log('📊 Dashboard data:', JSON.stringify(dashboardResponse.data.data, null, 2));
    
    console.log('\n🎉 All customer API tests passed!');
    
  } catch (error) {
    console.error('❌ Error testing customer API:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 409) {
      console.log('\n⚠️  User might already exist, trying to login directly...');
      
      try {
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'testcustomer@example.com',
          password: 'password123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful with existing user');
        
        // Test products API with existing user
        const productsResponse = await axios.get('http://localhost:5000/api/customer/products', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Products API test successful!');
        console.log('📦 Number of products:', productsResponse.data.data.length);
        
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError.response ? retryError.response.data : retryError.message);
      }
    }
  }
}

testCustomerAPI();
