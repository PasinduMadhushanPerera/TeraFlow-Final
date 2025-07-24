const axios = require('axios');

// Test script to create a material request and show real-time notifications

const API_BASE = 'http://localhost:5000/api';

const testRealTimeNotifications = async () => {
  try {
    console.log('🔐 Testing real-time notifications...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@terraflow.com',
      password: 'admin123'
    });

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 2: Get a supplier ID
    console.log('\n2. Getting supplier information...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const supplier = usersResponse.data.data.find(user => user.role === 'supplier');
    if (!supplier) {
      console.log('❌ No supplier found. Creating a test supplier...');
      
      // Create a test supplier
      const newSupplier = await axios.post(`${API_BASE}/auth/register`, {
        email: 'testsupplier@example.com',
        password: 'supplier123',
        full_name: 'Test Supplier',
        role: 'supplier',
        phone: '555-0123',
        company_name: 'Test Supply Co'
      });
      
      console.log('✅ Test supplier created:', newSupplier.data.user.email);
      supplier = newSupplier.data.user;
    } else {
      console.log('✅ Found supplier:', supplier.email);
    }

    // Step 3: Create material request
    console.log('\n3. Creating material request...');
    const materialRequest = await axios.post(`${API_BASE}/admin/material-requests`, {
      supplier_id: supplier.id,
      material_type: 'Steel Pipes',
      quantity: 100,
      unit: 'pieces',
      required_date: '2025-08-01',
      description: 'High-quality steel pipes for construction project'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Material request created:', materialRequest.data.data.id);

    // Step 4: Check supplier notifications
    console.log('\n4. Checking supplier notifications...');
    
    // First login as supplier
    const supplierLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: supplier.email,
      password: supplier.role === 'supplier' ? 'supplier123' : 'defaultpass123'
    }).catch(() => {
      // If login fails, try with a default password or create new credentials
      return { data: { token: null } };
    });

    if (supplierLogin.data.token) {
      const supplierToken = supplierLogin.data.token;
      
      const notifications = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${supplierToken}` }
      });

      console.log('✅ Supplier notifications found:', notifications.data.data.notifications.length);
      
      // Show recent notifications
      const recentNotifications = notifications.data.data.notifications.slice(0, 3);
      recentNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title}: ${notif.message}`);
      });
    } else {
      console.log('⚠️  Could not login as supplier to check notifications');
    }

    console.log('\n🎉 Real-time notification test completed!');
    console.log('💡 The notification should appear in the supplier\'s dashboard within 10-15 seconds');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
};

testRealTimeNotifications();
