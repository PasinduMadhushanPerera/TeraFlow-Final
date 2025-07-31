const axios = require('axios');

async function createTestNotificationForDelivery() {
  try {
    console.log('🔄 Creating test notification for delivery status update...\n');

    const API_BASE = 'http://localhost:5000/api';

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 2: Get suppliers
    console.log('\n2️⃣ Getting supplier list...');
    const suppliersResponse = await axios.get(`${API_BASE}/admin/suppliers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const supplier = suppliersResponse.data.data[0];
    console.log(`✅ Found supplier: ${supplier.full_name} (ID: ${supplier.id})`);

    // Step 3: Create a new material request
    console.log('\n3️⃣ Creating new material request...');
    const materialRequest = {
      supplier_id: supplier.id,
      material_type: `Delivery Test Material - ${new Date().toLocaleTimeString()}`,
      quantity: 50,
      unit: 'units',
      required_date: '2025-08-20',
      description: 'Test material request for delivery status update functionality'
    };

    const createResponse = await axios.post(`${API_BASE}/admin/material-requests`, materialRequest, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const requestId = createResponse.data.data.id;
    console.log(`✅ Material request created (ID: ${requestId})`);

    // Step 4: Verify supplier received notification
    console.log('\n4️⃣ Checking supplier notifications...');
    
    // Try to login as supplier
    try {
      const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: supplier.email,
        password: 'supplier123'
      });

      if (supplierLogin.data.success) {
        const supplierToken = supplierLogin.data.token;
        
        const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${supplierToken}` }
        });

        const notification = notificationsResponse.data.data.notifications.find(n => 
          n.related_id == requestId && n.type === 'delivery_request'
        );

        if (notification) {
          console.log('✅ Supplier received notification successfully');
          console.log(`   📬 Title: ${notification.title}`);
          console.log(`   💬 Message: ${notification.message}`);
          console.log(`   🔗 Related ID: ${notification.related_id}`);
        } else {
          console.log('⚠️ Notification not found in supplier inbox');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not verify supplier notifications (login issue)');
    }

    console.log('\n🎉 Test notification created successfully!');
    console.log('\n📱 How to test the Update Delivery Status link:');
    console.log('1. Open browser and go to: http://localhost:5173');
    console.log(`2. Login as supplier: ${supplier.email} / supplier123`);
    console.log('3. Go to Supplier → Notifications');
    console.log('4. Look for the material request notification');
    console.log('5. Click "Update Delivery Status →" link');
    console.log(`6. Should navigate to: /supplier/deliveries/${requestId}`);
    console.log('7. Test the delivery status update form');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

createTestNotificationForDelivery();
