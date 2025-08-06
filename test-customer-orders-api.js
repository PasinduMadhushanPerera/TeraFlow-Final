console.log('🧪 Testing Customer Orders API...\n');

async function testCustomerOrders() {
  try {
    // Step 1: Login as customer
    console.log('1️⃣ Logging in as customer...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@test.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    console.log('✅ Customer login successful:', loginData.user.full_name);

    // Step 2: Test customer orders API
    console.log('\n2️⃣ Fetching customer orders...');
    const ordersResponse = await fetch('http://localhost:5000/api/customer/orders', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', ordersResponse.status, ordersResponse.statusText);
    const ordersData = await ordersResponse.json();
    
    if (ordersData.success) {
      console.log('✅ Orders API working!');
      console.log('📊 Orders count:', ordersData.data.length);
      
      if (ordersData.data.length > 0) {
        const order = ordersData.data[0];
        console.log('\n📋 Sample Order:');
        console.log('   ID:', order.id);
        console.log('   Order Number:', order.order_number);
        console.log('   Status:', order.status);
        console.log('   Total:', order.total_amount);
        console.log('   Items:', order.items ? order.items.length : 0);
        console.log('   Customer:', order.customer_info ? order.customer_info.fullName : 'N/A');
      }
    } else {
      console.log('❌ Orders API failed:', ordersData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCustomerOrders();
