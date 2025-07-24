const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testNotificationCreation() {
  try {
    console.log('🔧 Testing Notification Creation Debug\n');

    // Login as admin first to check baseline
    console.log('1. 👨‍💼 Getting baseline admin notifications...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    
    const baselineResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const baselineNotifs = baselineResponse.data.data?.notifications || baselineResponse.data.data || [];
    console.log(`📊 Baseline: ${baselineNotifs.length} admin notifications`);

    // Login as supplier
    console.log('\n2. 👷 Supplier making status update...');
    const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'kanushka@gmail.com',
      password: 'kanushka123'
    });
    const supplierToken = supplierLogin.data.token;

    // Get the pending request
    const requestsResponse = await axios.get(`${API_BASE}/supplier/requests`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });
    const pendingRequest = requestsResponse.data.data.find(req => req.status === 'pending');
    
    if (!pendingRequest) {
      console.log('❌ No pending request found');
      return;
    }

    console.log(`📦 Updating request ${pendingRequest.id}: ${pendingRequest.material_type}`);

    // Make the update with debug info
    const startTime = Date.now();
    const updateResponse = await axios.put(`${API_BASE}/supplier/requests/${pendingRequest.id}/status`, {
      status: 'approved',
      supplier_response: `Debug test at ${new Date().toISOString()}`
    }, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });
    const endTime = Date.now();

    console.log(`✅ Update successful in ${endTime - startTime}ms`);
    console.log('📋 API Response:', updateResponse.data);

    // Wait and check again
    console.log('\n3. ⏳ Waiting 5 seconds for notification...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const afterResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const afterNotifs = afterResponse.data.data?.notifications || afterResponse.data.data || [];
    console.log(`📊 After update: ${afterNotifs.length} admin notifications`);

    // Check for new notifications
    if (afterNotifs.length > baselineNotifs.length) {
      console.log('🎉 New notification(s) detected!');
      const newNotifs = afterNotifs.slice(0, afterNotifs.length - baselineNotifs.length);
      newNotifs.forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.type}] ${notif.title}: ${notif.message}`);
        console.log(`      Related ID: ${notif.related_id}, Created: ${notif.created_at}`);
      });
    } else {
      console.log('❌ No new notifications created');
      
      // Let's check the notification controller directly
      console.log('\n4. 🧪 Testing notification controller directly...');
      try {
        const directNotifResponse = await axios.post(`${API_BASE}/notifications`, {
          user_id: adminLogin.data.user.id,
          type: 'material_update',
          title: '🧪 Test Notification',
          message: 'Direct test notification from debug script',
          related_type: 'material_request',
          related_id: pendingRequest.id
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Direct notification creation successful');
        console.log('📋 Response:', directNotifResponse.data);
      } catch (directError) {
        console.log('❌ Direct notification failed:', directError.response?.data || directError.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNotificationCreation();
