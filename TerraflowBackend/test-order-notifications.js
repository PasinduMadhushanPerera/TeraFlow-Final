const axios = require('axios');

// Test script to demonstrate order status notifications

const API_BASE = 'http://localhost:5000/api';

const testOrderNotifications = async () => {
  try {
    console.log('🛒 Testing order status notifications...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 2: Get an order to update
    console.log('\n2. Getting recent orders...');
    const ordersResponse = await axios.get(`${API_BASE}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!ordersResponse.data.data || ordersResponse.data.data.length === 0) {
      console.log('⚠️  No orders found to test with');
      return;
    }

    const order = ordersResponse.data.data[0];
    console.log(`✅ Found order #${order.order_number} (Status: ${order.status})`);

    // Step 3: Update order status
    console.log('\n3. Updating order status to "shipped"...');
    
    const updateResponse = await axios.put(`${API_BASE}/admin/orders/${order.id}/status`, {
      status: 'shipped',
      notes: 'Order has been shipped via express delivery'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Order status updated to shipped');

    // Step 4: Check customer notifications
    console.log('\n4. This should trigger a real-time notification to the customer!');
    console.log(`   Customer ID: ${order.customer_id}`);
    console.log('   Message: "Your order has been shipped and is on the way"');

    console.log('\n🎉 Order notification test completed!');
    console.log('💡 The customer should see this notification in their dashboard within 10-15 seconds');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
};

testOrderNotifications();
