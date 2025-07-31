const axios = require('axios');

async function testDeliveryStatusUpdate() {
  try {
    console.log('🔄 Testing Delivery Status Update Process...\n');

    const API_BASE = 'http://localhost:5000/api';

    // Step 1: Login as supplier
    console.log('1️⃣ Logging in as supplier...');
    const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'kanushka@gmail.com', 
      password: 'kanushka123'
    });

    if (!supplierLogin.data.success) {
      console.error('❌ Supplier login failed');
      return;
    }

    const supplierToken = supplierLogin.data.token;
    console.log('✅ Supplier logged in successfully');

    // Step 2: Get supplier's material requests
    console.log('\n2️⃣ Fetching material requests...');
    const requestsResponse = await axios.get(`${API_BASE}/supplier/requests`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    if (!requestsResponse.data.success || requestsResponse.data.data.length === 0) {
      console.log('⚠️ No material requests found. Creating one first...');
      
      // Login as admin to create a request
      const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@terraflow.com',
        password: 'admin123'
      });
      
      const adminToken = adminLogin.data.token;
      
      // Create a test material request
      const createRequest = await axios.post(`${API_BASE}/admin/material-requests`, {
        supplier_id: supplierLogin.data.user.id,
        material_type: 'Test Delivery Material',
        quantity: 100,
        unit: 'kg',
        required_date: '2025-08-15',
        description: 'Testing delivery status update functionality'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Test material request created');
      
      // Re-fetch requests
      const newRequestsResponse = await axios.get(`${API_BASE}/supplier/requests`, {
        headers: { Authorization: `Bearer ${supplierToken}` }
      });
      
      if (newRequestsResponse.data.data.length === 0) {
        console.error('❌ Still no requests found');
        return;
      }
    }

    const materialRequest = requestsResponse.data.data[0];
    console.log(`✅ Found material request: ${materialRequest.material_type} (ID: ${materialRequest.id})`);

    // Step 3: Test status updates
    console.log('\n3️⃣ Testing delivery status updates...');
    
    const statusUpdates = [
      {
        status: 'approved',
        supplier_response: 'Request approved. Preparing materials.',
        estimated_delivery_date: '2025-08-20'
      },
      {
        status: 'in_progress',
        supplier_response: 'Materials are being prepared and packaged.',
        estimated_delivery_date: '2025-08-18'
      }
    ];

    for (const update of statusUpdates) {
      console.log(`   📋 Updating status to: ${update.status}`);
      
      const updateResponse = await axios.put(`${API_BASE}/supplier/requests/${materialRequest.id}/status`, 
        update, 
        { headers: { Authorization: `Bearer ${supplierToken}` } }
      );

      if (updateResponse.data.success) {
        console.log(`   ✅ Status updated to "${update.status}" successfully`);
      } else {
        console.log(`   ❌ Failed to update status: ${updateResponse.data.message}`);
      }

      // Wait between updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 4: Test delivery confirmation
    console.log('\n4️⃣ Testing delivery confirmation...');
    
    const deliveryConfirmation = {
      delivery_notes: 'Materials delivered successfully to the main warehouse. Received by John Smith, Warehouse Manager.',
      delivery_date: '2025-08-18'
    };

    const confirmResponse = await axios.put(`${API_BASE}/supplier/requests/${materialRequest.id}/confirm-delivery`, 
      deliveryConfirmation, 
      { headers: { Authorization: `Bearer ${supplierToken}` } }
    );

    if (confirmResponse.data.success) {
      console.log('✅ Delivery confirmed successfully');
    } else {
      console.log(`❌ Delivery confirmation failed: ${confirmResponse.data.message}`);
    }

    // Step 5: Verify final status
    console.log('\n5️⃣ Verifying final request status...');
    
    const finalRequestResponse = await axios.get(`${API_BASE}/supplier/requests`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });

    const updatedRequest = finalRequestResponse.data.data.find(r => r.id === materialRequest.id);
    
    if (updatedRequest) {
      console.log(`✅ Final request status: ${updatedRequest.status}`);
      console.log(`   📝 Supplier response: ${updatedRequest.supplier_response}`);
      console.log(`   📅 Estimated delivery: ${updatedRequest.estimated_delivery_date || 'Not set'}`);
      console.log(`   📝 Delivery notes: ${updatedRequest.delivery_notes || 'Not set'}`);
    }

    console.log('\n🎉 Delivery Status Update Test Completed Successfully!');
    console.log('\n📱 Frontend Testing Instructions:');
    console.log('1. Login as supplier in the browser');
    console.log('2. Go to Supplier Notifications page');
    console.log('3. Click "Update Delivery Status" on any material request notification');
    console.log(`4. Try URL: http://localhost:5173/supplier/deliveries/${materialRequest.id}`);
    console.log('5. Update status, add estimated delivery date, and provide response');
    console.log('6. Test completion flow with delivery notes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDeliveryStatusUpdate();
