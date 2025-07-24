const axios = require('axios');

// Test supplier responding to material request to trigger admin notification
const API_BASE = 'http://localhost:5000/api';

const testSupplierResponse = async () => {
  try {
    console.log('🔄 Testing Supplier Response → Admin Notification\n');

    // Step 1: Login as supplier
    console.log('1. 👷 Supplier Login...');
    const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'kanushka@gmail.com',
      password: 'kanushka123'
    });
    const supplierToken = supplierLogin.data.token;
    console.log('✅ Supplier logged in successfully');

    // Step 2: Get pending material requests
    console.log('\n2. 📋 Getting pending material requests...');
    const requestsResponse = await axios.get(`${API_BASE}/supplier/requests`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    const pendingRequests = requestsResponse.data.data.filter(req => req.status === 'pending');
    
    if (pendingRequests.length === 0) {
      console.log('⚠️  No pending requests found');
      return;
    }

    const requestToUpdate = pendingRequests[0];
    console.log(`✅ Found pending request ID: ${requestToUpdate.id}`);
    console.log(`   📦 Material: ${requestToUpdate.material_type}`);
    console.log(`   ⚖️  Quantity: ${requestToUpdate.quantity} ${requestToUpdate.unit}`);

    // Step 3: Update request status
    console.log('\n3. ✅ Approving material request...');
    const updateResponse = await axios.put(`${API_BASE}/supplier/requests/${requestToUpdate.id}/status`, {
      status: 'approved',
      supplier_response: 'Request approved. Will deliver within 5 business days.'
    }, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    console.log('✅ Material request status updated to "approved"');

    // Step 4: Wait for notification processing
    console.log('\n4. ⏳ Waiting for admin notification...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Login as admin and check notifications
    console.log('\n5. 👨‍💼 Checking admin notifications...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;

    const adminNotifications = await axios.get(`${API_BASE}/notifications?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const recentNotifications = adminNotifications.data.data.notifications;
    console.log(`✅ Found ${recentNotifications.length} admin notifications`);

    // Look for material update notification
    const materialUpdateNotif = recentNotifications.find(n => 
      n.type === 'material_update' || 
      n.message.includes('accepted') ||
      n.related_id === requestToUpdate.id
    );

    if (materialUpdateNotif) {
      console.log('\n🎉 SUCCESS! Admin notification found:');
      console.log(`   📋 Title: ${materialUpdateNotif.title}`);
      console.log(`   💬 Message: ${materialUpdateNotif.message}`);
      console.log(`   🕒 Created: ${new Date(materialUpdateNotif.created_at).toLocaleString()}`);
      console.log(`   📖 Read Status: ${materialUpdateNotif.is_read ? 'Read' : 'Unread'}`);
    } else {
      console.log('⚠️  Material update notification not found');
      console.log('📝 Recent admin notifications:');
      recentNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.type}] ${notif.title}: ${notif.message.substring(0, 50)}...`);
      });
    }

    console.log('\n📱 Frontend Verification:');
    console.log('   1. Login as admin at http://localhost:5173');
    console.log('   2. Check notification bell');
    console.log('   3. Go to Admin → Notifications');
    console.log('   4. Look for material update notification');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
};

testSupplierResponse();
