const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function debugNotificationResponse() {
  try {
    console.log('🔍 DEBUG NOTIFICATION RESPONSE\n');

    // Login as admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    
    // Get raw response
    const response = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('📊 Full API Response:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n🔍 Analyzing response structure...');
    console.log('Response keys:', Object.keys(response.data));
    if (response.data.data) {
      console.log('Data keys:', Object.keys(response.data.data));
      if (response.data.data.notifications) {
        console.log('Notifications count:', response.data.data.notifications.length);
        console.log('First notification sample:');
        console.log(JSON.stringify(response.data.data.notifications[0], null, 2));
      }
    }

    // Try different API endpoints
    console.log('\n🧪 Testing different endpoints...');
    
    try {
      const statsResponse = await axios.get(`${API_BASE}/notifications/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('Stats response:', statsResponse.data);
    } catch (e) {
      console.log('Stats endpoint error:', e.response?.data || e.message);
    }

    // Check recent notifications with limit
    try {
      const recentResponse = await axios.get(`${API_BASE}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('\nRecent notifications (limit 20):');
      const notifications = recentResponse.data.data?.notifications || recentResponse.data.data || [];
      notifications.forEach((notif, index) => {
        console.log(`${index + 1}. [${notif.type || 'NO_TYPE'}] "${notif.title}" | Created: ${notif.created_at} | Read: ${notif.is_read}`);
      });
    } catch (e) {
      console.log('Recent endpoint error:', e.response?.data || e.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugNotificationResponse();
