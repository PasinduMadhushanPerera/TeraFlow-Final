/**
 * Test script to verify authentication is working
 */

const testLogin = async () => {
  try {
    console.log('🔐 Testing authentication...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      }),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Login result:', result);

    if (result.success && result.token) {
      console.log('✅ Login successful! Token received');
      
      // Test notifications endpoint with token
      console.log('🔔 Testing notifications endpoint...');
      
      const notificationsResponse = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${result.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Notifications response status:', notificationsResponse.status);
      const notificationsResult = await notificationsResponse.json();
      console.log('Notifications result:', notificationsResult);

      if (notificationsResponse.ok) {
        console.log('✅ Notifications endpoint working!');
      } else {
        console.log('❌ Notifications endpoint failed:', notificationsResult.message);
      }

    } else {
      console.log('❌ Login failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testLogin();
