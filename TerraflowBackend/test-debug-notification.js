const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testNotificationDebug() {
  try {
    console.log('🔄 Testing Notification Debug');
    
    // Step 1: Login as supplier
    console.log('\n1. 👷 Supplier Login...');
    const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'kanushka@gmail.com',
      password: 'kanushka123'
    });
    
    const supplierToken = supplierLogin.data.token;
    console.log('✅ Supplier logged in successfully');

    // Step 2: Get pending requests
    console.log('\n2. 📋 Getting pending material requests...');
    const requestsResponse = await axios.get(`${API_BASE}/supplier/requests`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    const pendingRequests = requestsResponse.data.data.filter(req => req.status === 'pending');
    
    if (pendingRequests.length === 0) {
      console.log('❌ No pending requests found');
      return;
    }

    const requestToUpdate = pendingRequests[0];
    console.log(`✅ Found pending request ID: ${requestToUpdate.id}`);
    console.log(`   📦 Material: ${requestToUpdate.material_type}`);
    console.log(`   ⚖️  Quantity: ${requestToUpdate.quantity} ${requestToUpdate.unit}`);

    // Step 3: Make the API call and capture the console output
    console.log('\n3. ✅ Making API call to update status...');
    
    const updateResponse = await axios.put(`${API_BASE}/supplier/requests/${requestToUpdate.id}/status`, {
      status: 'approved',
      supplier_response: 'Request approved. Will deliver within 5 business days.'
    }, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    console.log('✅ API Response:', updateResponse.data);

    // Wait a moment and check notifications
    console.log('\n4. ⏳ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check admin notifications
    console.log('\n5. 👨‍💼 Checking admin notifications...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('📊 Notifications response:', JSON.stringify(notificationsResponse.data, null, 2));

    const notifications = notificationsResponse.data.data?.notifications || notificationsResponse.data.data || [];
    console.log(`✅ Found ${notifications.length} admin notifications`);

    const materialNotifications = notifications.filter(n => n.type === 'material_update');
    
    if (materialNotifications.length > 0) {
      console.log('✅ Material update notifications found:');
      materialNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.type}] ${notif.title}: ${notif.message}`);
      });
    } else {
      console.log('⚠️  No material update notifications found');
      
      console.log('\n📝 All admin notifications:');
      notifications.slice(0, 5).forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.type}] ${notif.title}: ${notif.message.substring(0, 60)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNotificationDebug();
