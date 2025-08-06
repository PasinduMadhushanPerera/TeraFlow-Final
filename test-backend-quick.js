/**
 * Quick test to check backend status and login endpoint
 */

async function testBackendStatus() {
  try {
    console.log('Testing backend status...');
    
    // Test server health
    const healthResponse = await fetch('http://localhost:5000/api/customer/products', {
      method: 'GET'
    });
    
    console.log('Products endpoint status:', healthResponse.status);
    const healthResult = await healthResponse.json();
    console.log('Products response:', healthResult);
    
    // Test login endpoint
    console.log('\nTesting login endpoint...');
    const loginResponse = await fetch('http://localhost:5000/api/customer/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'customer@test.com',
        password: 'password123'
      })
    });
    
    console.log('Login endpoint status:', loginResponse.status);
    const loginResult = await loginResponse.json();
    console.log('Login response:', loginResult);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBackendStatus();
