/**
 * Test script to verify that the 'approved' status works correctly in the admin orders system
 */

const testApprovedStatus = async () => {
  console.log('🧪 Testing Approved Status Functionality...\n');

  try {
    // Test 1: Admin login
    console.log('1️⃣  Testing admin login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('❌ Admin login failed:', loginData.message);
      return;
    }
    console.log('✅ Admin login successful');
    console.log('🔍 Login response:', JSON.stringify(loginData, null, 2));

    const adminToken = loginData.token;

    // Test 2: Get all orders
    console.log('\n2️⃣  Fetching all orders...');
    const ordersResponse = await fetch('http://localhost:5000/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const ordersData = await ordersResponse.json();
    if (!ordersData.success) {
      console.error('❌ Failed to fetch orders:', ordersData.message);
      return;
    }
    console.log(`✅ Found ${ordersData.data.length} orders`);

    // Test 3: Update an order to 'approved' status
    if (ordersData.data.length > 0) {
      const testOrder = ordersData.data[0];
      console.log(`\n3️⃣  Testing status update to 'approved' for order ID: ${testOrder.id}`);
      console.log(`    Current status: ${testOrder.status}`);

      const updateResponse = await fetch(`http://localhost:5000/api/admin/orders/${testOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'approved',
          notes: 'Test update to approved status'
        })
      });

      const updateData = await updateResponse.json();
      if (!updateData.success) {
        console.error('❌ Failed to update order status:', updateData.message);
        return;
      }
      console.log('✅ Order status updated to approved successfully');

      // Test 4: Verify the status persists
      console.log('\n4️⃣  Verifying status persistence...');
      const verifyResponse = await fetch('http://localhost:5000/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const verifyData = await verifyResponse.json();
      const updatedOrder = verifyData.data.find(order => order.id === testOrder.id);
      
      if (updatedOrder && updatedOrder.status === 'approved') {
        console.log('✅ Status persistence verified - order shows as approved');
        console.log(`    Order ID: ${updatedOrder.id}`);
        console.log(`    Status: ${updatedOrder.status}`);
        console.log(`    Updated at: ${updatedOrder.updated_at}`);
      } else {
        console.error('❌ Status not persisting - order does not show as approved');
        console.error('    Current status:', updatedOrder ? updatedOrder.status : 'Order not found');
      }

    } else {
      console.log('⚠️  No orders found to test with');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Run the test
testApprovedStatus();
