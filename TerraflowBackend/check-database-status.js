const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking Database Status\n');

    // Login as supplier
    console.log('1. 👷 Supplier Login...');
    const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'kanushka@gmail.com',
      password: 'kanushka123'
    });
    const supplierToken = supplierLogin.data.token;
    console.log('✅ Supplier logged in successfully');

    // Get all material requests
    console.log('\n2. 📋 Getting all material requests...');
    const requestsResponse = await axios.get(`${API_BASE}/supplier/requests`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    const allRequests = requestsResponse.data.data;
    console.log(`✅ Found ${allRequests.length} total material requests`);

    if (allRequests.length > 0) {
      console.log('\n📝 Material Requests Status:');
      allRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id} | Material: ${req.material_type} | Status: ${req.status} | Quantity: ${req.quantity} ${req.unit}`);
      });

      // If there are non-pending requests, reset one to pending for testing
      const completedRequest = allRequests.find(req => req.status !== 'pending');
      if (completedRequest) {
        console.log(`\n3. 🔄 Resetting request ${completedRequest.id} to pending for testing...`);
        
        try {
          const resetResponse = await axios.put(`${API_BASE}/supplier/requests/${completedRequest.id}/status`, {
            status: 'pending',
            supplier_response: ''
          }, {
            headers: { Authorization: `Bearer ${supplierToken}` }
          });
          
          console.log(`✅ Request ${completedRequest.id} reset to pending status`);
        } catch (error) {
          console.log(`⚠️  Could not reset request status: ${error.response?.data?.message || error.message}`);
        }
      }
    } else {
      console.log('⚠️  No material requests found in database');
    }

    // Check notifications
    console.log('\n4. 📨 Checking supplier notifications...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    const notifications = notificationsResponse.data.data?.notifications || notificationsResponse.data.data || [];
    console.log(`✅ Found ${notifications.length} supplier notifications`);

    if (notifications.length > 0) {
      console.log('\n📝 Recent Notifications:');
      notifications.slice(0, 5).forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.type}] ${notif.title}: ${notif.message.substring(0, 60)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error.response?.data || error.message);
  }
}

checkDatabaseStatus();
