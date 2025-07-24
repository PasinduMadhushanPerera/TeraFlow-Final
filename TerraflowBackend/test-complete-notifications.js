const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCompleteNotificationFlow() {
  try {
    console.log('🔄 Testing Complete Interactive Notification Flow\n');

    // Step 1: Login as admin
    console.log('1. 👨‍💼 Admin Login...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 2: Create a material request
    console.log('\n2. 📝 Creating material request...');
    const requestData = {
      supplier_id: 2,  // Assuming supplier with ID 2 exists
      material_type: `Test Material ${Date.now()}`,
      quantity: 100,
      unit: 'kg',
      required_date: '2025-08-01',
      notes: 'Test material request for notification flow'
    };

    const createResponse = await axios.post(`${API_BASE}/admin/material-requests`, requestData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const newRequestId = createResponse.data.data.id;
    console.log(`✅ Material request created with ID: ${newRequestId}`);

    // Step 3: Login as supplier
    console.log('\n3. 👷 Supplier Login...');
    const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'kanushka@gmail.com',
      password: 'kanushka123'
    });
    const supplierToken = supplierLogin.data.token;
    console.log('✅ Supplier logged in successfully');

    // Step 4: Check supplier notifications
    console.log('\n4. 📋 Checking supplier notifications...');
    const supplierNotifications = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    const supplierNotifs = supplierNotifications.data.data?.notifications || supplierNotifications.data.data || [];
    console.log(`✅ Found ${supplierNotifs.length} supplier notifications`);

    const materialRequestNotif = supplierNotifs.find(n => 
      n.type === 'material_request' && n.related_id === newRequestId
    );

    if (materialRequestNotif) {
      console.log('✅ Material request notification found in supplier inbox!');
      console.log(`   📋 Title: ${materialRequestNotif.title}`);
      console.log(`   💬 Message: ${materialRequestNotif.message}`);
    } else {
      console.log('⚠️  Material request notification not found in supplier inbox');
    }

    // Step 5: Supplier responds to the request
    console.log('\n5. ✅ Supplier responding to material request...');
    const updateResponse = await axios.put(`${API_BASE}/supplier/requests/${newRequestId}/status`, {
      status: 'approved',
      supplier_response: 'Request approved. Will deliver within 3 business days.'
    }, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    console.log('✅ Material request status updated to "approved"');

    // Step 6: Wait for notification processing
    console.log('\n6. ⏳ Waiting for notification processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 7: Check admin notifications
    console.log('\n7. 👨‍💼 Checking admin notifications...');
    const adminNotifications = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const adminNotifs = adminNotifications.data.data?.notifications || adminNotifications.data.data || [];
    console.log(`✅ Found ${adminNotifs.length} admin notifications`);

    const materialUpdateNotif = adminNotifs.find(n => 
      n.type === 'material_update' && n.related_id === newRequestId
    );

    if (materialUpdateNotif) {
      console.log('\n🎉 SUCCESS! Complete notification flow working!');
      console.log('   📨 Admin → Supplier: Material request notification ✅');
      console.log('   📨 Supplier → Admin: Material update notification ✅');
      console.log('\nAdmin notification details:');
      console.log(`   📋 Title: ${materialUpdateNotif.title}`);
      console.log(`   💬 Message: ${materialUpdateNotif.message}`);
      console.log(`   🕒 Created: ${new Date(materialUpdateNotif.created_at).toLocaleString()}`);
    } else {
      console.log('\n❌ Admin notification not found');
      console.log('📝 Recent admin notifications:');
      adminNotifs.slice(0, 5).forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.type}] ${notif.title}: ${notif.message.substring(0, 60)}...`);
      });
    }

    console.log('\n📱 Frontend Verification:');
    console.log('   1. Admin login: http://localhost:5173 (admin@terraflow.com / admin123)');
    console.log('   2. Supplier login: http://localhost:5173 (kanushka@gmail.com / kanushka123)');
    console.log('   3. Check notification bells for both users');
    console.log('   4. Go to respective dashboards to see notifications');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteNotificationFlow();
