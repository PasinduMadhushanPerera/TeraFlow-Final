// Simple test to check if admin login works
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      })
    });
    
    const result = await response.json();
    console.log('Login response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Admin login successful');
      
      // Test notifications endpoint
      const notifResponse = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${result.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const notifResult = await notifResponse.json();
      console.log('Notifications response:', JSON.stringify(notifResult, null, 2));
      
    } else {
      console.log('❌ Admin login failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminLogin();
